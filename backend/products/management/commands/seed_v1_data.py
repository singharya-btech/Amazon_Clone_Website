from django.core.management.base import BaseCommand
from products.models import Category, Product, Banner


class Command(BaseCommand):
    help = 'Seeds initial sample categories, products, and banners for Version 1'

    def handle(self, *args, **options):
        self.stdout.write("Seeding sample data for Version 1...")

        electronics, _ = Category.objects.get_or_create(
            slug='electronics',
            defaults={'name': 'Electronics', 'image': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'}
        )
        computers, _ = Category.objects.get_or_create(
            slug='computers',
            defaults={'name': 'Computers & Accessories', 'image': 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500'}
        )
        home, _ = Category.objects.get_or_create(
            slug='home-kitchen',
            defaults={'name': 'Home & Kitchen', 'image': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500'}
        )

        sample_products = [
            {
                'name': 'Wireless Noise-Canceling Headphones',
                'slug': 'wireless-noise-canceling-headphones',
                'category': electronics,
                'brand': 'AudioMax',
                'description': 'Premium over-ear wireless headphones with active noise cancellation and 30-hour battery life.',
                'price': 149.99,
                'compare_price': 199.99,
                'image': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
                'stock': 45,
                'is_featured': True,
                'rating': 4.7,
                'num_reviews': 32,
            },
            {
                'name': 'Ergonomic Mechanical Keyboard',
                'slug': 'ergonomic-mechanical-keyboard',
                'category': computers,
                'brand': 'KeyTech',
                'description': 'Customizable RGB mechanical keyboard with tactile switches and wrist rest.',
                'price': 89.99,
                'compare_price': 119.99,
                'image': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600',
                'stock': 28,
                'is_featured': True,
                'rating': 4.5,
                'num_reviews': 18,
            },
            {
                'name': 'Stainless Steel Pour-Over Coffee Maker',
                'slug': 'stainless-steel-coffee-maker',
                'category': home,
                'brand': 'BrewCraft',
                'description': 'Double-walled insulated pour-over coffee brewer for rich, barista-grade coffee.',
                'price': 39.99,
                'compare_price': 49.99,
                'image': 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=600',
                'stock': 60,
                'is_featured': False,
                'rating': 4.8,
                'num_reviews': 45,
            },
            {
                'name': 'Ultra-Wide 4K Gaming Monitor 32"',
                'slug': 'ultra-wide-4k-gaming-monitor',
                'category': computers,
                'brand': 'VisionPro',
                'description': '144Hz refresh rate, 1ms response time, HDR400 IPS panel for crystal-clear clarity.',
                'price': 429.99,
                'compare_price': 499.99,
                'image': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600',
                'stock': 15,
                'is_featured': True,
                'rating': 4.9,
                'num_reviews': 54,
            }
        ]

        for p in sample_products:
            Product.objects.get_or_create(slug=p['slug'], defaults=p)

        Banner.objects.get_or_create(
            title='Mega Tech Deals',
            defaults={
                'subtitle': 'Up to 40% off on top electronics',
                'image': 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200',
                'link': '/category/electronics',
                'is_active': True,
                'order': 1
            }
        )

        self.stdout.write(self.style.SUCCESS("Successfully seeded Version 1 sample catalog!"))
