from datetime import datetime, timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Cart
from products.models import Product
from .serializers import CartSerializer, AddToCartSerializer, UpdateCartItemSerializer


class CartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cart, _ = Cart.objects.get_or_create(
            user_id=request.user.id,
            defaults={'user_username': request.user.username}
        )
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    def post(self, request):
        serializer = AddToCartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            product = Product.objects.get(id=serializer.validated_data['product_id'])
        except (Product.DoesNotExist, ValueError):
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        cart, _ = Cart.objects.get_or_create(
            user_id=request.user.id,
            defaults={'user_username': request.user.username}
        )

        # Check if product already in cart
        items = list(cart.items)
        found = False
        for item in items:
            if str(item.get('product_id')) == str(product.id):
                item['quantity'] = item.get('quantity', 0) + serializer.validated_data['quantity']
                found = True
                break

        if not found:
            items.append({
                'product_id': product.id,
                'product_name': product.name,
                'product_price': product.price,
                'product_image': product.image,
                'quantity': serializer.validated_data['quantity'],
                'created_at': datetime.now(timezone.utc).isoformat(),
            })

        cart.items = items
        cart.save()
        cart_serializer = CartSerializer(cart)
        return Response(cart_serializer.data, status=status.HTTP_200_OK)

    def delete(self, request):
        """Clear all items from the user's cart."""
        cart, _ = Cart.objects.get_or_create(
            user_id=request.user.id,
            defaults={'user_username': request.user.username}
        )
        cart.items = []
        cart.save()
        return Response(CartSerializer(cart).data)


class CartItemDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, item_id):
        try:
            cart = Cart.objects.get(user_id=request.user.id)
        except Cart.DoesNotExist:
            return Response({'error': 'Cart not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = UpdateCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        qty = serializer.validated_data['quantity']

        items = list(cart.items)
        found = False
        for i, item in enumerate(items):
            if str(item.get('product_id')) == str(item_id):
                if qty == 0:
                    items.pop(i)
                else:
                    item['quantity'] = qty
                found = True
                break

        if not found:
            return Response({'error': 'Cart item not found'}, status=status.HTTP_404_NOT_FOUND)

        cart.items = items
        cart.save()
        cart_serializer = CartSerializer(cart)
        return Response(cart_serializer.data)

    def delete(self, request, item_id):
        try:
            cart = Cart.objects.get(user_id=request.user.id)
        except Cart.DoesNotExist:
            return Response({'error': 'Cart not found'}, status=status.HTTP_404_NOT_FOUND)

        items = list(cart.items)
        found = False
        for i, item in enumerate(items):
            if str(item.get('product_id')) == str(item_id):
                items.pop(i)
                found = True
                break

        if not found:
            return Response({'error': 'Cart item not found'}, status=status.HTTP_404_NOT_FOUND)

        cart.items = items
        cart.save()
        cart_serializer = CartSerializer(cart)
        return Response(cart_serializer.data)
