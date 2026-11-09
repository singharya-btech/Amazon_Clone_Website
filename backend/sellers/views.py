import csv
import io
import uuid
from datetime import datetime, timezone
from django.contrib.auth.models import User
from django.utils.text import slugify
from django.db.utils import IntegrityError
from django.db import transaction
from django.db.models import Sum, Count
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from core.serializers import UserSerializer
from core.permissions import IsSuperAdminUser
from products.models import Category, Product
from products.serializers import ProductSerializer, ProductListSerializer
from orders.models import Order

from .models import (
    Seller,
    SellerPayout,
    AuditLog,
    PaymentTransaction,
    ShippingShipment,
)
from .serializers import (
    SellerSerializer,
    SellerRegisterSerializer,
    SellerLoginSerializer,
    SellerProductCreateSerializer,
    SellerPayoutSerializer,
    AuditLogSerializer,
    PaymentTransactionSerializer,
    ShippingShipmentSerializer,
)


def _get_seller_for_user(user):
    return Seller.objects.filter(user_id=user.id).first()


def _log_audit(user, role, action, resource_type, resource_id="", details=None, ip="127.0.0.1"):
    AuditLog.objects.create(
        user_id=user.id if user and user.is_authenticated else None,
        username=user.username if user and user.is_authenticated else "system",
        role=role,
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id),
        ip_address=ip,
        details=details or {},
    )


class SellerRegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SellerRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        data.pop('password2')
        password = data.pop('password')
        email = data['email']

        if User.objects.filter(username=email).exists() or Seller.objects.filter(email=email).first():
            return Response(
                {'detail': 'An account with this email already exists.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.create_user(username=email, email=email, password=password)

        seller = Seller(
            user_id=user.id,
            business_name=data['business_name'],
            owner_name=data['owner_name'],
            email=email,
            phone=data.get('phone', ''),
            category_focus=data.get('category_focus', ''),
            registration_id=data.get('registration_id', ''),
            business_description=data.get('business_description', ''),
            bank_details=data.get('bank_details', ''),
            status='pending',
        )
        try:
            seller.save()
        except IntegrityError:
            user.delete()
            return Response(
                {'detail': 'An account with this email already exists.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if data.get('category_focus'):
            cat_name = data['category_focus']
            if not Category.objects.filter(name=cat_name).first():
                Category(name=cat_name, slug=slugify(cat_name)).save()

        _log_audit(user, "seller", "REGISTER", "Seller", seller.id, {"business_name": seller.business_name})

        refresh = RefreshToken.for_user(user)
        refresh['role'] = 'seller'
        return Response({
            'seller': SellerSerializer(seller).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)


class SellerLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SellerLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        try:
            user = User.objects.get(username=email)
        except User.DoesNotExist:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.check_password(password):
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        seller = _get_seller_for_user(user)
        if not seller:
            return Response({'error': 'No seller account found for this login.'}, status=status.HTTP_403_FORBIDDEN)

        _log_audit(user, "seller", "LOGIN", "Seller", seller.id)

        refresh = RefreshToken.for_user(user)
        refresh['role'] = 'seller'
        return Response({
            'seller': SellerSerializer(seller).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })


class SellerMeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        seller = _get_seller_for_user(request.user)
        if not seller:
            return Response({'error': 'Not a seller account.'}, status=status.HTTP_403_FORBIDDEN)
        return Response(SellerSerializer(seller).data)


class SellerMeProductsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        seller = _get_seller_for_user(request.user)
        if not seller:
            return Response({'error': 'Not a seller account.'}, status=status.HTTP_403_FORBIDDEN)
        products = Product.objects.filter(seller=seller).order_by('-created_at')
        return Response(ProductListSerializer(products, many=True).data)

    def post(self, request):
        seller = _get_seller_for_user(request.user)
        if not seller:
            return Response({'error': 'Not a seller account.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = SellerProductCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data

        category_name = validated.pop('category', None)
        category = None
        if category_name:
            category = Category.objects.filter(name=category_name).first()
            if not category:
                category = Category(name=category_name, slug=slugify(category_name))
                category.save()

        base_slug = slugify(validated['name'])
        slug = base_slug
        counter = 1
        while Product.objects.filter(slug=slug).first() is not None:
            slug = f"{base_slug}-{counter}"
            counter += 1

        product = Product(
            category=category,
            seller=seller,
            slug=slug,
            **validated,
        )
        product.save()
        _log_audit(request.user, "seller", "CREATE_PRODUCT", "Product", product.id, {"name": product.name})
        return Response(ProductSerializer(product).data, status=status.HTTP_201_CREATED)


class SellerMeProductDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, product_id):
        seller = _get_seller_for_user(request.user)
        if not seller:
            return Response({'error': 'Not a seller account.'}, status=status.HTTP_403_FORBIDDEN)
        product = Product.objects.filter(id=product_id, seller=seller).first()
        if not product:
            return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ProductSerializer(product).data)

    def put(self, request, product_id):
        return self.patch(request, product_id)

    def patch(self, request, product_id):
        seller = _get_seller_for_user(request.user)
        if not seller:
            return Response({'error': 'Not a seller account.'}, status=status.HTTP_403_FORBIDDEN)
        product = Product.objects.filter(id=product_id, seller=seller).first()
        if not product:
            return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        for field in ['name', 'description', 'price', 'compare_price', 'stock', 'image', 'image_2', 'image_3', 'is_active']:
            if field in request.data:
                setattr(product, field, request.data[field])

        category_name = request.data.get('category')
        if category_name:
            category = Category.objects.filter(name=category_name).first()
            if not category:
                category = Category.objects.create(name=category_name, slug=slugify(category_name))
            product.category = category

        product.save()
        _log_audit(request.user, "seller", "UPDATE_PRODUCT", "Product", product.id)
        return Response(ProductSerializer(product).data)

    def delete(self, request, product_id):
        seller = _get_seller_for_user(request.user)
        if not seller:
            return Response({'error': 'Not a seller account.'}, status=status.HTTP_403_FORBIDDEN)
        product = Product.objects.filter(id=product_id, seller=seller).first()
        if not product:
            return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)
        prod_id = product.id
        product.delete()
        _log_audit(request.user, "seller", "DELETE_PRODUCT", "Product", prod_id)
        return Response({'message': 'Product deleted.'}, status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Admin-only seller management
# ---------------------------------------------------------------------------

class AdminSellerListView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        query = Seller.objects.all()
        status_filter = request.query_params.get('status')
        if status_filter:
            query = query.filter(status=status_filter)
        return Response(SellerSerializer(query, many=True).data)


class AdminSellerVerifyView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, seller_id):
        seller = Seller.objects.filter(id=seller_id).first()
        if not seller:
            return Response({'error': 'Seller not found.'}, status=status.HTTP_404_NOT_FOUND)
        seller.status = 'verified'
        seller.save()
        _log_audit(request.user, "admin", "VERIFY_SELLER", "Seller", seller.id)
        return Response(SellerSerializer(seller).data)


class AdminSellerRejectView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, seller_id):
        seller = Seller.objects.filter(id=seller_id).first()
        if not seller:
            return Response({'error': 'Seller not found.'}, status=status.HTTP_404_NOT_FOUND)
        seller.status = 'rejected'
        seller.save()
        _log_audit(request.user, "admin", "REJECT_SELLER", "Seller", seller.id)
        return Response(SellerSerializer(seller).data)


class AdminSellerFlagView(APIView):
    """Regular Admin can red-flag a seller (e.g. suspected fraud) but cannot
    remove them — only a SuperAdmin can act on a flag."""
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, seller_id):
        seller = Seller.objects.filter(id=seller_id).first()
        if not seller:
            return Response({'error': 'Seller not found.'}, status=status.HTTP_404_NOT_FOUND)
        seller.is_flagged = True
        seller.flag_reason = request.data.get('reason', '')
        seller.save()
        _log_audit(request.user, "admin", "FLAG_SELLER", "Seller", seller.id, {"reason": seller.flag_reason})
        return Response(SellerSerializer(seller).data)


class AdminSellerUnflagView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, seller_id):
        seller = Seller.objects.filter(id=seller_id).first()
        if not seller:
            return Response({'error': 'Seller not found.'}, status=status.HTTP_404_NOT_FOUND)
        seller.is_flagged = False
        seller.flag_reason = ''
        seller.save()
        _log_audit(request.user, "admin", "UNFLAG_SELLER", "Seller", seller.id)
        return Response(SellerSerializer(seller).data)


class AdminSellerDetailView(APIView):
    """SuperAdmin-only: permanently remove a (typically flagged) seller and
    cascade-delete everything they own."""
    permission_classes = [IsSuperAdminUser]

    def delete(self, request, seller_id):
        seller = Seller.objects.filter(id=seller_id).first()
        if not seller:
            return Response({'error': 'Seller not found.'}, status=status.HTTP_404_NOT_FOUND)

        Product.objects.filter(seller=seller).delete()
        User.objects.filter(id=seller.user_id).delete()
        seller_id_val = seller.id
        seller.delete()
        _log_audit(request.user, "admin", "DELETE_SELLER", "Seller", seller_id_val)
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminSellerProductsView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request, seller_id):
        seller = Seller.objects.filter(id=seller_id).first()
        if not seller:
            return Response({'error': 'Seller not found.'}, status=status.HTTP_404_NOT_FOUND)
        products = Product.objects.filter(seller=seller).order_by('-created_at')
        return Response(ProductListSerializer(products, many=True).data)


class SellerBulkCSVUploadView(APIView):
    """
    Bulk CSV Product Upload for Sellers.
    Expected CSV columns: name, price, stock, category, description
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        seller = _get_seller_for_user(request.user)
        if not seller:
            return Response({'error': 'Not a seller account.'}, status=status.HTTP_403_FORBIDDEN)

        csv_file = request.FILES.get('file')
        csv_text = request.data.get('csv_data')

        if not csv_file and not csv_text:
            return Response({'error': 'Upload a CSV file or provide csv_data text.'}, status=status.HTTP_400_BAD_REQUEST)

        if csv_file:
            decoded = csv_file.read().decode('utf-8')
            reader = csv.DictReader(io.StringIO(decoded))
        else:
            reader = csv.DictReader(io.StringIO(csv_text))

        created_count = 0
        errors = []

        for row_idx, row in enumerate(reader, start=1):
            name = row.get('name', '').strip()
            price_str = row.get('price', '0').strip()
            stock_str = row.get('stock', '0').strip()
            cat_name = row.get('category', '').strip()
            desc = row.get('description', '').strip()

            if not name:
                errors.append(f"Row {row_idx}: 'name' is required.")
                continue

            try:
                price = float(price_str)
                stock = int(stock_str)
            except ValueError:
                errors.append(f"Row {row_idx}: Invalid price or stock format.")
                continue

            category = None
            if cat_name:
                category, _ = Category.objects.get_or_create(
                    name=cat_name,
                    defaults={'slug': slugify(cat_name)}
                )

            base_slug = slugify(name)
            slug = base_slug
            c = 1
            while Product.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{c}"
                c += 1

            Product.objects.create(
                seller=seller,
                category=category,
                name=name,
                slug=slug,
                price=price,
                stock=stock,
                description=desc,
                is_active=True
            )
            created_count += 1

        _log_audit(request.user, "seller", "BULK_CSV_UPLOAD", "Product", details={"count": created_count})
        return Response({
            'message': f"Successfully created {created_count} products from CSV.",
            'created_count': created_count,
            'errors': errors
        }, status=status.HTTP_201_CREATED)


class SellerReportsView(APIView):
    """
    Sales and Commission analytics for the seller.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        seller = _get_seller_for_user(request.user)
        if not seller:
            return Response({'error': 'Not a seller account.'}, status=status.HTTP_403_FORBIDDEN)

        # Iterate all orders and sum items belonging to this seller
        orders = Order.objects.all()
        gross_sales = 0.0
        units_sold = 0
        seller_orders_count = 0

        for o in orders:
            seller_items = [i for i in o.items if i.get('seller_id') == seller.id]
            if seller_items:
                seller_orders_count += 1
                for item in seller_items:
                    qty = int(item.get('quantity') or 1)
                    price = float(item.get('product_price') or item.get('price') or 0)
                    gross_sales += (price * qty)
                    units_sold += qty

        commission_rate = seller.commission_rate
        total_commission = round((gross_sales * commission_rate) / 100.0, 2)
        net_earnings = round(gross_sales - total_commission, 2)

        return Response({
            'gross_sales': round(gross_sales, 2),
            'units_sold': units_sold,
            'orders_count': seller_orders_count,
            'commission_rate': commission_rate,
            'total_commission_paid': total_commission,
            'net_earnings': net_earnings,
            'available_balance': seller.balance,
        })


class SellerPayoutView(APIView):
    """
    Seller payout request and history.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        seller = _get_seller_for_user(request.user)
        if not seller:
            return Response({'error': 'Not a seller account.'}, status=status.HTTP_403_FORBIDDEN)
        payouts = SellerPayout.objects.filter(seller=seller)
        return Response(SellerPayoutSerializer(payouts, many=True).data)

    def post(self, request):
        seller = _get_seller_for_user(request.user)
        if not seller:
            return Response({'error': 'Not a seller account.'}, status=status.HTTP_403_FORBIDDEN)

        amount = float(request.data.get('amount', 0))
        if amount <= 0:
            return Response({'error': 'Amount must be greater than zero.'}, status=status.HTTP_400_BAD_REQUEST)

        if amount > seller.balance:
            return Response({'error': f"Requested amount ₹{amount} exceeds your balance of ₹{seller.balance:.2f}."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            seller.balance -= amount
            seller.save(update_fields=['balance'])

            payout = SellerPayout.objects.create(
                seller=seller,
                amount=amount,
                status='pending',
                bank_details=request.data.get('bank_details', seller.bank_details),
                notes=request.data.get('notes', 'Seller withdrawal request')
            )

        _log_audit(request.user, "seller", "REQUEST_PAYOUT", "SellerPayout", payout.id, {"amount": amount})
        return Response(SellerPayoutSerializer(payout).data, status=status.HTTP_201_CREATED)


class SellerOrdersView(APIView):
    """
    Seller-specific order items view.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        seller = _get_seller_for_user(request.user)
        if not seller:
            return Response({'error': 'Not a seller account.'}, status=status.HTTP_403_FORBIDDEN)

        orders = Order.objects.all().order_by('-created_at')
        seller_orders = []

        for o in orders:
            relevant_items = [i for i in o.items if i.get('seller_id') == seller.id]
            if relevant_items:
                seller_orders.append({
                    'order_id': o.id,
                    'order_status': o.status,
                    'customer_name': o.full_name,
                    'shipping_address': f"{o.address}, {o.city}, {o.state} - {o.zip_code}",
                    'created_at': o.created_at,
                    'items': relevant_items,
                    'seller_subtotal': sum(float(i.get('product_price', 0)) * int(i.get('quantity', 1)) for i in relevant_items)
                })

        return Response(seller_orders)


class SellerOrderShipView(APIView):
    """
    Seller dispatches a line-item and creates a simulated shipment with tracking number.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, order_id):
        seller = _get_seller_for_user(request.user)
        if not seller:
            return Response({'error': 'Not a seller account.'}, status=status.HTTP_403_FORBIDDEN)

        order = Order.objects.filter(id=order_id).first()
        if not order:
            return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        carrier = request.data.get('carrier', 'Delhivery Express')
        tracking_number = f"TRK-{uuid.uuid4().hex[:10].upper()}"

        with transaction.atomic():
            # Update seller's items in order
            updated_any = False
            for item in order.items:
                if item.get('seller_id') == seller.id:
                    item['item_status'] = 'shipped'
                    item['tracking_number'] = tracking_number
                    item['carrier'] = carrier
                    updated_any = True

            if not updated_any:
                return Response({'error': 'No items in this order belong to your seller account.'}, status=status.HTTP_400_BAD_REQUEST)

            order.recompute_status()
            order.save()

            shipment = ShippingShipment.objects.create(
                order_id=str(order.id),
                seller=seller,
                carrier=carrier,
                tracking_number=tracking_number,
                status='in_transit'
            )

        _log_audit(request.user, "seller", "SHIP_ORDER", "Order", order.id, {"tracking": tracking_number})
        return Response({
            'message': 'Order shipment created successfully.',
            'tracking_number': tracking_number,
            'carrier': carrier,
            'shipment': ShippingShipmentSerializer(shipment).data
        })


class PaymentSandboxCheckoutView(APIView):
    """
    Sandbox Payment Gateway Abstraction.
    Simulates payment initiation and card/UPI validation.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        order_id = request.data.get('order_id')
        amount = float(request.data.get('amount', 0))
        payment_method = request.data.get('payment_method', 'card')

        if not order_id or amount <= 0:
            return Response({'error': 'order_id and valid amount required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Simulate sandbox transaction
        txn_id = f"PAY-SBX-{uuid.uuid4().hex[:12].upper()}"
        webhook_sig = f"sig_{uuid.uuid4().hex[:16]}"

        txn = PaymentTransaction.objects.create(
            order_id=str(order_id),
            user_id=request.user.id if request.user.is_authenticated else 1,
            amount=amount,
            gateway_name='sandbox_gateway',
            status='success',
            transaction_id=txn_id,
            webhook_signature=webhook_sig,
            metadata={'card_last4': '4242', 'payment_method': payment_method}
        )

        return Response({
            'success': True,
            'transaction_id': txn.transaction_id,
            'gateway': 'Sandbox Gateway',
            'status': 'authorized',
            'amount': amount,
            'webhook_signature': webhook_sig
        }, status=status.HTTP_201_CREATED)


class PaymentWebhookView(APIView):
    """
    Payment webhook receiver with signature validation.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        signature = request.headers.get('X-Payment-Signature', request.data.get('signature'))
        txn_id = request.data.get('transaction_id')

        if not signature or not txn_id:
            return Response({'error': 'Missing signature or transaction_id.'}, status=status.HTTP_400_BAD_REQUEST)

        txn = PaymentTransaction.objects.filter(transaction_id=txn_id).first()
        if not txn:
            return Response({'error': 'Transaction not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Validate signature
        if txn.webhook_signature and txn.webhook_signature != signature:
            return Response({'error': 'Invalid webhook signature.'}, status=status.HTTP_401_UNAUTHORIZED)

        return Response({'status': 'verified', 'transaction_id': txn.transaction_id})


class AdminMarketplaceAnalyticsView(APIView):
    """
    Admin Marketplace overview analytics.
    """
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        total_orders = Order.objects.count()
        total_revenue = Order.objects.aggregate(sum=Sum('total'))['sum'] or 0.0
        total_sellers = Seller.objects.count()
        verified_sellers = Seller.objects.filter(status='verified').count()
        total_products = Product.objects.count()
        pending_payouts = SellerPayout.objects.filter(status='pending').count()

        # 10% commission estimation
        estimated_commission = round(total_revenue * 0.10, 2)

        return Response({
            'total_gmv': round(total_revenue, 2),
            'estimated_commission': estimated_commission,
            'total_orders': total_orders,
            'total_sellers': total_sellers,
            'verified_sellers': verified_sellers,
            'total_products': total_products,
            'pending_payouts': pending_payouts,
        })


class AdminAuditLogView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        logs = AuditLog.objects.all()[:100]
        return Response(AuditLogSerializer(logs, many=True).data)


class AdminPayoutProcessView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, payout_id):
        payout = SellerPayout.objects.filter(id=payout_id).first()
        if not payout:
            return Response({'error': 'Payout not found.'}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action', 'process')  # process or reject

        if action == 'process':
            payout.status = 'processed'
            payout.processed_at = datetime.now(timezone.utc)
            payout.save()
            _log_audit(request.user, "admin", "PROCESS_PAYOUT", "SellerPayout", payout.id)
            return Response({'message': f"Payout #{payout.id} processed successfully."})
        elif action == 'reject':
            # Refund back to seller balance
            payout.seller.balance += payout.amount
            payout.seller.save(update_fields=['balance'])
            payout.status = 'rejected'
            payout.save()
            _log_audit(request.user, "admin", "REJECT_PAYOUT", "SellerPayout", payout.id)
            return Response({'message': f"Payout #{payout.id} rejected, amount refunded to balance."})

        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
