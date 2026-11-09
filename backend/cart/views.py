from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Cart
from products.models import Product, ProductVariant
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
        variant_id = serializer.validated_data.get('variant_id')
        quantity = serializer.validated_data['quantity']

        product = Product.objects.filter(pk=product_id, is_active=True).first()
        if not product:
            return Response({'error': 'Product not found or inactive.'}, status=status.HTTP_404_NOT_FOUND)

        # Determine price, SKU, variant name, and available stock
        item_price = product.price
        item_sku = product.sku or f"PRD-{product.id}"
        variant_name = ""
        available_stock = product.stock

        if variant_id:
            variant = ProductVariant.objects.filter(pk=variant_id, product=product, is_active=True).first()
            if not variant:
                return Response({'error': 'Selected variant not found.'}, status=status.HTTP_404_NOT_FOUND)
            if variant.price_override is not None:
                item_price = variant.price_override
            item_sku = variant.sku
            variant_name = variant.name
            available_stock = variant.stock

        # Stock management verification
        if available_stock <= 0:
            return Response({'error': f'"{product.name}" is currently out of stock.'}, status=status.HTTP_400_BAD_REQUEST)

        cart = self._get_cart(request)
        items = list(cart.items)

        # Match by product_id AND variant_id
        found = False
        for item in items:
            if item.get('product_id') == product.id and item.get('variant_id') == variant_id:
                new_qty = item.get('quantity', 0) + quantity
                if new_qty > available_stock:
                    return Response({
                        'error': f'Cannot add {quantity} more. Only {available_stock} units available.'
                    }, status=status.HTTP_400_BAD_REQUEST)
                item['quantity'] = new_qty
                found = True
                break

        if not found:
            if quantity > available_stock:
                return Response({
                    'error': f'Requested quantity exceeds available stock ({available_stock} units).'
                }, status=status.HTTP_400_BAD_REQUEST)

            items.append({
                'product_id': product.id,
                'variant_id': variant_id,
                'variant_name': variant_name,
                'sku': item_sku,
                'product_name': product.name,
                'product_price': item_price,
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
        variant_id = serializer.validated_data.get('variant_id')

        product = Product.objects.filter(pk=item_id).first()
        available_stock = product.stock if product else 999
        if variant_id and product:
            variant = ProductVariant.objects.filter(pk=variant_id, product=product).first()
            if variant:
                available_stock = variant.stock

        if qty > available_stock:
            return Response({
                'error': f'Cannot update quantity. Only {available_stock} units available.'
            }, status=status.HTTP_400_BAD_REQUEST)

        cart = self._get_cart(request)
        items = []
        for item in cart.items:
            matches_product = item.get('product_id') == int(item_id)
            matches_variant = (variant_id is None) or (item.get('variant_id') == variant_id)

            if matches_product and matches_variant:
                if qty > 0:
                    item['quantity'] = qty
                    items.append(item)
            else:
                items.append(item)

        cart.items = items
        cart.save()
        return Response(CartSerializer(cart).data)

    def delete(self, request, item_id):
        variant_id = request.query_params.get('variant_id')
        cart = self._get_cart(request)
        new_items = []
        for item in cart.items:
            if item.get('product_id') == int(item_id):
                if variant_id is not None and str(item.get('variant_id')) != str(variant_id):
                    new_items.append(item)
            else:
                new_items.append(item)

        cart.items = new_items
        cart.save()
        return Response(CartSerializer(cart).data)
