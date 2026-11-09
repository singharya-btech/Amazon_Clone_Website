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

        cart = self._get_cart(request)
        items = list(cart.items)

        found = False
        for item in items:
            if item.get('product_id') == product.id:
                item['quantity'] = item.get('quantity', 0) + quantity
                found = True
                break

        if not found:
            items.append({
                'product_id': product.id,
                'product_name': product.name,
                'product_price': product.price,
                'product_image': product.image,
                'quantity': quantity
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
