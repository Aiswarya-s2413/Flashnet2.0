from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('sales_app', '0015_alter_primarysales_fields'),
    ]

    operations = [
        migrations.CreateModel(
            name='SalesExecutiveMapping',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('classification', models.CharField(blank=True, max_length=100, null=True)),
                ('sales_leader', models.CharField(blank=True, max_length=255, null=True)),
                ('regional_manager', models.CharField(blank=True, max_length=255, null=True)),
                ('sales_rep', models.CharField(blank=True, max_length=255, null=True)),
                ('key_account', models.CharField(blank=True, max_length=255, null=True)),
                ('active_status', models.CharField(blank=True, max_length=50, null=True)),
                ('ship_to', models.CharField(db_index=True, max_length=100)),
                ('ship_to_party', models.CharField(blank=True, max_length=255, null=True)),
                ('group_name', models.CharField(blank=True, max_length=255, null=True)),
                ('dist_direct', models.CharField(blank=True, max_length=50, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
    ]
