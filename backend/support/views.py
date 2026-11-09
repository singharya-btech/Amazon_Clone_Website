from datetime import datetime, timezone

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from products.models import Product
from sellers.models import Seller

from .models import CustomerQuery
from .serializers import CustomerQuerySerializer, CustomerQueryCreateSerializer


def _display_name(user):
    full = f"{user.first_name} {user.last_name}".strip()
    return full or user.username


def _make_reply(author_role, author_name, message):
    return {
        'author_role': author_role,
        'author_name': author_name,
        'message': message,
        'created_at': datetime.now(timezone.utc).isoformat(),
    }


class CustomerQueryListCreateView(APIView):
    """A customer's own queries — general messages or ones tied to an order/product."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        queries = CustomerQuery.objects.filter(customer_user_id=request.user.id)
        return Response(CustomerQuerySerializer(queries, many=True).data)

    def post(self, request):
        serializer = CustomerQueryCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        product = None
        seller = None
        product_id = data.get('product_id')
        if product_id:
            product = Product.objects.filter(id=product_id).first()
            if product and product.seller:
                seller = product.seller

        query = CustomerQuery(
            customer_user_id=request.user.id,
            customer_name=_display_name(request.user),
            customer_email=request.user.email,
            subject=data['subject'],
            category=data.get('category', 'general'),
            message=data['message'],
            order_id=data.get('order_id', ''),
            product=product,
            seller=seller,
        )
        query.save()
        return Response(CustomerQuerySerializer(query).data, status=status.HTTP_201_CREATED)


class SellerQueryListView(APIView):
    """Queries tied to this seller's products — sellers reply here first."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        seller = Seller.objects.filter(user_id=request.user.id).first()
        if not seller:
            return Response({'error': 'Not a seller account.'}, status=status.HTTP_403_FORBIDDEN)
        queries = CustomerQuery.objects.filter(seller=seller)
        return Response(CustomerQuerySerializer(queries, many=True).data)


class SellerQueryReplyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, query_id):
        seller = Seller.objects.filter(user_id=request.user.id).first()
        if not seller:
            return Response({'error': 'Not a seller account.'}, status=status.HTTP_403_FORBIDDEN)

        query = CustomerQuery.objects.filter(id=query_id, seller=seller).first()
        if not query:
            return Response({'error': 'Query not found.'}, status=status.HTTP_404_NOT_FOUND)

        message = request.data.get('message', '').strip()
        if not message:
            return Response({'error': 'Reply message is required.'}, status=status.HTTP_400_BAD_REQUEST)

        query.replies = [*query.replies, _make_reply('seller', seller.business_name, message)]
        query.status = 'replied'
        query.save()
        return Response(CustomerQuerySerializer(query).data)


class AdminQueryListView(APIView):
    """Admin sees every query and can step in after the seller."""
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        query = CustomerQuery.objects.all()
        status_filter = request.query_params.get('status')
        if status_filter:
            query = query.filter(status=status_filter)
        return Response(CustomerQuerySerializer(query.order_by('-created_at'), many=True).data)


class AdminQueryReplyView(APIView):
    """Admin reply — can also mark the query escalated or resolved."""
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, query_id):
        query = CustomerQuery.objects.filter(id=query_id).first()
        if not query:
            return Response({'error': 'Query not found.'}, status=status.HTTP_404_NOT_FOUND)

        message = request.data.get('message', '').strip()
        if message:
            query.replies = [*query.replies, _make_reply('admin', _display_name(request.user), message)]

        new_status = request.data.get('status')
        if new_status in ('escalated', 'resolved', 'replied', 'open'):
            query.status = new_status

        query.save()
        return Response(CustomerQuerySerializer(query).data)
