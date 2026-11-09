from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Wishlist
from .serializers import WishlistSerializer, WishlistToggleSerializer


class WishlistView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def _get_wishlist(self, user):
        wishlist, _ = Wishlist.objects.get_or_create(
            user_id=user.id,
            defaults={'user_username': user.username, 'product_ids': [], 'product_names': []}
        )
        return wishlist

    def get(self, request):
        wishlist = self._get_wishlist(request.user)
        return Response(WishlistSerializer(wishlist).data)

    def post(self, request):
        serializer = WishlistToggleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        pid = serializer.validated_data['product_id']
        pname = serializer.validated_data.get('product_name', '')

        wishlist = self._get_wishlist(request.user)
        ids = list(wishlist.product_ids)
        names = list(wishlist.product_names)

        if pid in ids:
            idx = ids.index(pid)
            ids.remove(pid)
            if idx < len(names):
                names.pop(idx)
            action = 'removed'
        else:
            ids.append(pid)
            names.append(pname)
            action = 'added'

        wishlist.product_ids = ids
        wishlist.product_names = names
        wishlist.save()

        return Response({
            'action': action,
            'wishlist': WishlistSerializer(wishlist).data
        })
