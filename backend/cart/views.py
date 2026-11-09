from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Cart
from products.models import Product
from .serializers import CartSerializer, AddToCartSerializer, UpdateCartItemSerializer


class CartView(APIView):
    permission_classes = [permissions.AllowAny]

    def _get_cart(self, request):
        user_id = request.user.id if request.user.is_authenticated else 1
        username = request.user.username if request.user.is_authenticated else 'guest'
        cart, _ = Cart.objects.get_or_create(
            user_id=user_id,
            defaults={'user_username': username, 'items': []}
        )
        return cart

    def get(self, request):
        cart = self._get_cart(request)
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    def post(self, request):
        serializer = AddToCartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product_id = serializer.validated_data['product_id']
        quantity = serializer.validated_data['quantity']

        product = Product.objects.filter(pk=product_id, is_active=True).first()
        if not product:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        if product.stock < quantity:
            return Response(
                {'error': f"Only {product.stock} items available in stock."},
                status=status.HTTP_400_BAD_REQUEST
            )

        cart = self._get_cart(request)
        items = list(cart.items)

        found = False
        for item in items:
            if item.get('product_id') == product.id:
                new_qty = item.get('quantity', 0) + quantity
                if new_qty > product.stock:
                    return Response(
                        {'error': f"Cannot add {quantity} more; total exceeds stock of {product.stock}."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                item['quantity'] = new_qty
                found = True
                break

        if not found:
            items.append({
                'product_id': product.id,
                'product_name': product.name,
                'product_price': product.price,
                'product_image': product.image,
                'quantity': quantity,
                'stock': product.stock
            })

        cart.items = items
        cart.save()
        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)


class CartItemDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def _get_cart(self, request):
        user_id = request.user.id if request.user.is_authenticated else 1
        username = request.user.username if request.user.is_authenticated else 'guest'
        cart, _ = Cart.objects.get_or_create(
            user_id=user_id,
            defaults={'user_username': username, 'items': []}
        )
        return cart

    def put(self, request, item_id):
        serializer = UpdateCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        qty = serializer.validated_data['quantity']

        cart = self._get_cart(request)
        items = []
        for item in cart.items:
            if item.get('product_id') == int(item_id):
                if qty > 0:
                    product = Product.objects.filter(pk=int(item_id)).first()
                    if product and qty > product.stock:
                        qty = product.stock
                    item['quantity'] = qty
                    items.append(item)
            else:
                items.append(item)

        cart.items = items
        cart.save()
        return Response(CartSerializer(cart).data)

    def delete(self, request, item_id):
        cart = self._get_cart(request)
        cart.items = [item for item in cart.items if item.get('product_id') != int(item_id)]
        cart.save()
        return Response(CartSerializer(cart).data)


class CartMergeView(APIView):
    """
    Merges local guest cart items into authenticated user's database cart upon login.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        guest_items = request.data.get('items', [])
        if not isinstance(guest_items, list):
            return Response({'error': 'items must be a list'}, status=status.HTTP_400_BAD_REQUEST)

        cart, _ = Cart.objects.get_or_create(
            user_id=request.user.id,
            defaults={'user_username': request.user.username, 'items': []}
        )
        current_items = list(cart.items)

        for g_item in guest_items:
            pid = g_item.get('id') or g_item.get('product_id')
            qty = int(g_item.get('quantity') or 1)
            if not pid:
                continue

            product = Product.objects.filter(pk=pid, is_active=True).first()
            if not product or product.stock <= 0:
                continue

            matched = False
            for c_item in current_items:
                if c_item.get('product_id') == product.id:
                    c_item['quantity'] = min(c_item.get('quantity', 0) + qty, product.stock)
                    matched = True
                    break

            if not matched:
                current_items.append({
                    'product_id': product.id,
                    'product_name': product.name,
                    'product_price': product.price,
                    'product_image': product.image,
                    'quantity': min(qty, product.stock),
                    'stock': product.stock
                })

        cart.items = current_items
        cart.save()
        return Response({
            'message': 'Cart merged successfully',
            'cart': CartSerializer(cart).data
        }, status=status.HTTP_200_OK)


class ClearCartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        cart = Cart.objects.filter(user_id=request.user.id).first()
        if cart:
            cart.items = []
            cart.save()
        return Response({'message': 'Cart cleared successfully'})
