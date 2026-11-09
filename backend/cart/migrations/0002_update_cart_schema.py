from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cart', '0001_initial'),
    ]

    operations = [
        migrations.DeleteModel(
            name='CartItem',
        ),
        migrations.RemoveField(
            model_name='cart',
            name='user',
        ),
        migrations.AddField(
            model_name='cart',
            name='user_id',
            field=models.IntegerField(db_index=True, default=1, unique=True),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='cart',
            name='user_username',
            field=models.CharField(blank=True, max_length=150),
        ),
        migrations.AddField(
            model_name='cart',
            name='items',
            field=models.JSONField(blank=True, default=list),
        ),
    ]
