from django.core.management.base import BaseCommand
from products.models import Category, Product, ProductImage, ProductVariant, Banner, Coupon


class Command(BaseCommand):
    help = 'Seeds initial sample catalog with variants, gallery images, SKUs, and coupons for Version 1'

    def handle(self, *args, **options):
        self.stdout.write("Seeding enhanced sample catalog for Version 1...")

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

        # 1. Product 1: Wireless Headphones
        p1, _ = Product.objects.get_or_create(
            slug='wireless-noise-canceling-headphones',
            defaults={
                'name': 'Wireless Noise-Canceling Headphones',
                'sku': 'AUD-WNC-001',
                'category': electronics,
                'brand': 'AudioMax',
                'description': 'Premium over-ear wireless headphones with active noise cancellation and 30-hour battery life.',
                'specifications': {
                    'Battery Life': '30 Hours',
                    'Connectivity': 'Bluetooth 5.3',
                    'Weight': '250g',
                    'Noise Cancellation': 'Active (ANC)',
                    'Warranty': '1 Year'
                },
                'price': 149.99,
                'compare_price': 199.99,
                'image': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
                'stock': 45,
                'low_stock_threshold': 5,
                'is_featured': True,
                'rating': 4.7,
                'num_reviews': 32,
            }
        )

        # Product 1 Images
        ProductImage.objects.get_or_create(product=p1, order=1, defaults={'image_url': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', 'alt_text': 'Front View', 'is_primary': True})
        ProductImage.objects.get_or_create(product=p1, order=2, defaults={'image_url': 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800', 'alt_text': 'Earcups Detail', 'is_primary': False})
        ProductImage.objects.get_or_create(product=p1, order=3, defaults={'image_url': 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800', 'alt_text': 'Profile View', 'is_primary': False})

        # Product 1 Variants
        ProductVariant.objects.get_or_create(sku='AUD-WNC-BLK', defaults={'product': p1, 'name': 'Matte Black', 'color': 'Black', 'stock': 25, 'price_override': 149.99})
        ProductVariant.objects.get_or_create(sku='AUD-WNC-SLV', defaults={'product': p1, 'name': 'Silver Metallic', 'color': 'Silver', 'stock': 20, 'price_override': 159.99})

        # 2. Product 2: Mechanical Keyboard
        p2, _ = Product.objects.get_or_create(
            slug='ergonomic-mechanical-keyboard',
            defaults={
                'name': 'Ergonomic Mechanical Keyboard',
                'sku': 'KEY-RGB-002',
                'category': computers,
                'brand': 'KeyTech',
                'description': 'Customizable RGB mechanical keyboard with tactile switches and detachable wrist rest.',
                'specifications': {
                    'Switch Type': 'Tactile Brown / Linear Red',
                    'Backlight': 'RGB Per-Key',
                    'Key Layout': 'Tenkeyless (87 Keys)',
                    'Interface': 'USB-C Detachable Cable'
                },
                'price': 89.99,
                'compare_price': 119.99,
                'image': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600',
                'stock': 28,
                'is_featured': True,
                'rating': 4.5,
                'num_reviews': 18,
            }
        )

        ProductImage.objects.get_or_create(product=p2, order=1, defaults={'image_url': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800', 'alt_text': 'Top Angled View', 'is_primary': True})
        ProductImage.objects.get_or_create(product=p2, order=2, defaults={'image_url': 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800', 'alt_text': 'Keycaps Close Up', 'is_primary': False})

        ProductVariant.objects.get_or_create(sku='KEY-RGB-BRN', defaults={'product': p2, 'name': 'Tactile Brown Switches', 'color': 'Black', 'stock': 18, 'price_override': 89.99})
        ProductVariant.objects.get_or_create(sku='KEY-RGB-RED', defaults={'product': p2, 'name': 'Linear Red Switches', 'color': 'White', 'stock': 10, 'price_override': 94.99})

        # 3. Product 3: Coffee Maker
        p3, _ = Product.objects.get_or_create(
            slug='stainless-steel-coffee-maker',
            defaults={
                'name': 'Stainless Steel Pour-Over Coffee Maker',
                'sku': 'KIT-POUR-003',
                'category': home,
                'brand': 'BrewCraft',
                'description': 'Double-walled insulated pour-over coffee brewer with permanent stainless mesh filter.',
                'specifications': {
                    'Capacity': '800ml (4 Cups)',
                    'Material': '18/8 Food-Grade Stainless Steel',
                    'Dishwasher Safe': 'Yes'
                },
                'price': 39.99,
                'compare_price': 49.99,
                'image': 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=600',
                'stock': 4,  # Demonstrates low-stock state
                'low_stock_threshold': 5,
                'is_featured': False,
                'rating': 4.8,
                'num_reviews': 45,
            }
        )

        # 4. Product 4: 4K Gaming Monitor
        p4, _ = Product.objects.get_or_create(
            slug='ultra-wide-4k-gaming-monitor',
            defaults={
                'name': 'Ultra-Wide 4K Gaming Monitor 32"',
                'sku': 'MON-4K-004',
                'category': computers,
                'brand': 'VisionPro',
                'description': '144Hz refresh rate, 1ms response time, HDR400 IPS panel for stunning contrast.',
                'specifications': {
                    'Resolution': '3840 x 2160 (4K UHD)',
                    'Refresh Rate': '144Hz',
                    'Response Time': '1ms GtG',
                    'Panel Type': 'IPS'
                },
                'price': 429.99,
                'compare_price': 499.99,
                'image': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600',
                'stock': 15,
                'is_featured': True,
                'rating': 4.9,
                'num_reviews': 54,
            }
        )

        # Seed Coupons
        Coupon.objects.get_or_create(
            code='SAVE10',
            defaults={
                'discount_type': 'percent',
                'discount_value': 10.0,
                'min_order_amount': 50.0,
                'is_active': True
            }
        )
        Coupon.objects.get_or_create(
            code='FLAT25',
            defaults={
                'discount_type': 'fixed',
                'discount_value': 25.0,
                'min_order_amount': 100.0,
                'is_active': True
            }
        )
        Coupon.objects.get_or_create(
            code='WELCOME20',
            defaults={
                'discount_type': 'percent',
                'discount_value': 20.0,
                'min_order_amount': 75.0,
                'is_active': True
            }
        )

        # Banners
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

        self.stdout.write(self.style.SUCCESS("Successfully seeded Version 1 enhanced catalog!"))
