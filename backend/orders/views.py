from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Order
from products.models import Product
from sellers.views import _get_seller_for_user
from .serializers import OrderSerializer, CreateOrderSerializer, UpdateItemStatusSerializer


class OrderListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(user_id=request.user.id)
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CreateOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)

        # Items come straight from the frontend cart (product_id + quantity).
        # We look each product up ourselves rather than trusting client-sent
        # price/name/image, so a tampered payload can't under-price an order.
        cart_items = data.pop('items')
        if not cart_items:
            return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

        order_items = []
        total = 0
        for entry in cart_items:
            product = Product.objects.filter(id=entry['product_id']).first()
            if not product:
                return Response(
                    {'error': f"Product {entry['product_id']} not found."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            qty = entry['quantity']
            subtotal = product.price * qty
            total += subtotal
            order_items.append({
                'product_id': product.id,
                'product_name': product.name,
                'product_price': product.price,
                'product_image': product.image,
                'quantity': qty,
                'subtotal': subtotal,
                'seller_id': product.seller_id,
                'item_status': 'pending',
            })

        order = Order(
            user_id=request.user.id,
            user_username=request.user.username,
            items=order_items,
            total=total,
            **data
        )
        order.save()

        order_serializer = OrderSerializer(order)
        return Response(order_serializer.data, status=status.HTTP_201_CREATED)


class OrderDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, order_id):
        try:
            order = Order.objects.get(id=order_id, user_id=request.user.id)
            serializer = OrderSerializer(order)
            return Response(serializer.data)
        except (Order.DoesNotExist, ValueError):
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, order_id):
        """Cancel an order — only the order's owner can cancel it."""
        try:
            order = Order.objects.get(id=order_id, user_id=request.user.id)
        except (Order.DoesNotExist, ValueError):
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
        order.status = 'cancelled'
        order.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SellerOrderListView(APIView):
    """List every order that contains at least one item sold by the logged-in
    seller. Only that seller's own items are relevant to them, but the whole
    order is returned so they have shipping/contact context."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        seller = _get_seller_for_user(request.user)
        if not seller:
            return Response({'detail': 'Seller account not found.'}, status=status.HTTP_404_NOT_FOUND)

        orders = [o for o in Order.objects.all()
                  if any(item.get('seller_id') == seller.id for item in o.items)]
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)


class SellerOrderItemStatusUpdateView(APIView):
    """Let a seller mark their own line item within an order as
    processing/shipped/delivered/cancelled. The order's overall status is
    recomputed from all items afterwards."""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, order_id, product_id):
        seller = _get_seller_for_user(request.user)
        if not seller:
            return Response({'detail': 'Seller account not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = UpdateItemStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data['item_status']

        try:
            order = Order.objects.get(id=order_id)
        except (Order.DoesNotExist, ValueError):
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

        updated = False
        items = order.items
        for item in items:
            if str(item.get('product_id')) == str(product_id) and item.get('seller_id') == seller.id:
                item['item_status'] = new_status
                updated = True

        if not updated:
            return Response(
                {'detail': "This item wasn't found in this order under your seller account."},
                status=status.HTTP_404_NOT_FOUND,
            )

        order.items = items
        order.recompute_status()
        order.save()
        return Response(OrderSerializer(order).data)
