from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Wishlist
from products.models import Product
from .serializers import WishlistSerializer, AddToWishlistSerializer


class WishlistView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        wishlist, _ = Wishlist.objects.get_or_create(
            user_id=request.user.id,
            defaults={'user_username': request.user.username}
        )
        serializer = WishlistSerializer(wishlist)
        return Response(serializer.data)

    def post(self, request):
        serializer = AddToWishlistSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            product = Product.objects.get(id=serializer.validated_data['product_id'])
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
        
        wishlist, _ = Wishlist.objects.get_or_create(
            user_id=request.user.id,
            defaults={'user_username': request.user.username}
        )
        
        product_id_str = str(product.id)
        if product_id_str in [str(pid) for pid in wishlist.product_ids]:
            wishlist.product_ids.remove(product.id)
            if product.name in wishlist.product_names:
                wishlist.product_names.remove(product.name)
            message = 'Removed from wishlist'
        else:
            wishlist.product_ids.append(product.id)
            wishlist.product_names.append(product.name)
            message = 'Added to wishlist'
        
        wishlist.save()
        wishlist_serializer = WishlistSerializer(wishlist)
        return Response({
            'message': message,
            'wishlist': wishlist_serializer.data
        }, status=status.HTTP_200_OK)

    def delete(self, request):
        product_id = request.data.get('product_id') or request.query_params.get('product_id')
        if not product_id:
            return Response({'error': 'product_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
        
        try:
            wishlist = Wishlist.objects.get(user_id=request.user.id)
        except Wishlist.DoesNotExist:
            return Response({'error': 'Wishlist not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if product.id in wishlist.product_ids:
            wishlist.product_ids.remove(product.id)
            if product.name in wishlist.product_names:
                wishlist.product_names.remove(product.name)
        
        wishlist.save()
        wishlist_serializer = WishlistSerializer(wishlist)
        return Response({
            'message': 'Removed from wishlist',
            'wishlist': wishlist_serializer.data
        })