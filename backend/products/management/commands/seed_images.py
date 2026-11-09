from django.core.management.base import BaseCommand
from products.models import Product, Banner, Category

# Relevant product images from Unsplash (direct image URLs for specific products)
PRODUCT_IMAGES = {
    'Wireless Bluetooth Headphones': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
    'Smart Watch Pro': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
    'USB-C Charging Cable 2m': 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&h=400&fit=crop',
    'Portable Bluetooth Speaker': 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop',
    "Men's Casual Cotton T-Shirt": 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
    "Women's Running Shoes": 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
    'Denim Jacket': 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=400&h=400&fit=crop',
    'Stainless Steel Water Bottle': 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&fit=crop',
    'Non-Stick Cookware Set': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop',
    'LED Desk Lamp': 'https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=400&h=400&fit=crop',
    'The Art of Programming': 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=400&fit=crop',
    'Mystery Novel Collection': 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=400&fit=crop',
    'Yoga Mat Premium': 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&h=400&fit=crop',
    'Dumbbell Set 10kg': 'https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=400&h=400&fit=crop',
    'Face Moisturizer SPF 30': 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop',
    'Vitamin C Serum': 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop',
}

BANNER_IMAGES = {
    'Summer Sale': 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=500&fit=crop',
    'New Arrivals': 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&h=500&fit=crop',
    'Electronics Deals': 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1200&h=500&fit=crop',
}

CATEGORY_IMAGES = {
    'Electronics': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=200&h=200&fit=crop',
    'Clothing': 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=200&h=200&fit=crop',
    'Home & Kitchen': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop',
    'Books': 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=200&h=200&fit=crop',
    'Sports & Fitness': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop',
    'Beauty': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&h=200&fit=crop',
}


class Command(BaseCommand):
    help = 'Seed placeholder image URLs for products, banners, and categories'

    def handle(self, *args, **options):
        count = 0
        for product in Product.objects.all():
            if product.name in PRODUCT_IMAGES:
                product.image = PRODUCT_IMAGES[product.name]
                product.save(update_fields=['image'])
                count += 1
                self.stdout.write(f'  Set image for: {product.name}')

        self.stdout.write(self.style.SUCCESS(f'Updated {count} products with relevant images'))

        banner_count = 0
        for banner in Banner.objects.all():
            if banner.title in BANNER_IMAGES:
                banner.image = BANNER_IMAGES[banner.title]
                banner.save(update_fields=['image'])
                banner_count += 1
                self.stdout.write(f'  Set image for banner: {banner.title}')

        self.stdout.write(self.style.SUCCESS(f'Updated {banner_count} banners with relevant images'))

        cat_count = 0
        for cat in Category.objects.all():
            if cat.name in CATEGORY_IMAGES:
                cat.image = CATEGORY_IMAGES[cat.name]
                cat.save(update_fields=['image'])
                cat_count += 1
                self.stdout.write(f'  Set image for category: {cat.name}')

        self.stdout.write(self.style.SUCCESS(f'Updated {cat_count} categories with relevant images'))
