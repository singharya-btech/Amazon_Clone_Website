from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Order
from cart.models import Cart
from .serializers import OrderSerializer, CreateOrderSerializer


class OrderListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(user_id=request.user.id)
        return Response(OrderSerializer(orders, many=True).data)

    def post(self, request):
        serializer = CreateOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cart = Cart.objects.filter(user_id=request.user.id).first()
        if not cart or not cart.items:
            return Response({'error': 'Cart is empty. Add products before checkout.'}, status=status.HTTP_400_BAD_REQUEST)

        order = Order.objects.create(
            user_id=request.user.id,
            user_username=request.user.username,
            full_name=serializer.validated_data['full_name'],
            email=serializer.validated_data['email'],
            phone=serializer.validated_data.get('phone', ''),
            address=serializer.validated_data['address'],
            city=serializer.validated_data['city'],
            state=serializer.validated_data['state'],
            zip_code=serializer.validated_data['zip_code'],
            country=serializer.validated_data.get('country', 'India'),
            status='pending',
            items=cart.items,
            total=cart.total_price,
        )

        # Clear user cart after successful order
        cart.items = []
        cart.save()

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        order = Order.objects.filter(pk=pk, user_id=request.user.id).first()
        if not order:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(OrderSerializer(order).data)
