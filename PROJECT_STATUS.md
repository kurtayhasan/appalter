# Appalter - Proje Durumu ve Mimari Raporu

## 1. Vizyon ve Proje Özeti
Appalter, yazılımları, alternatiflerini ve karşılaştırmalarını yapay zeka destekli, çok dilli (i18n) ve SEO odaklı bir altyapıda sunmayı hedefleyen **Kurumsal Ölçekli bir SaaS ve Veri Fabrikası** (Data Factory) sistemidir. Doğrudan milyonlarca sayfa görüntülenmesini ve devasa veri setlerini yüksek performansla yönetmek üzere kurgulanmıştır.

## 2. Teknoloji Yığını (Tech Stack)
*   **Frontend & Mimari:** Next.js (App Router, Server Components, SSR/SSG)
*   **Backend & Veritabanı:** Supabase (PostgreSQL)
*   **Yapay Zeka & Arama:** pgvector (Semantic Search)
*   **Dil ve Yerelleştirme:** Next.js Dinamik Rotalama (`[locale]`)

## 3. Veritabanı Mimarisi (Production-Ready)
Supabase/PostgreSQL şeması kusursuz bir iskelete oturtulmuştur.

### 3.1. Yüksek Performanslı Loglama ve Bölümlendirme (Partitioning)
*   Hızla büyümesi beklenen `audit_logs`, `change_logs` ve `affiliate_clicks` tabloları için zaman bazlı bölümlendirme (Partitioning) mimarisi kurulmuştur.
*   Bu yapı `PRIMARY KEY (id, created_at)` kuralı ile güvence altına alınmış, milyonlarca satırda bile sorgu performansının düşmemesi sağlanmıştır.

### 3.2. Küresel Çok Dilli Altyapı (i18n)
*   Veritabanı merkezine yerleştirilen `software_translations` ve `category_translations` tabloları, `locale` kolonu üzerinden dünyanın tüm dillerine anında çeviri sunabilecek şekilde tasarlanmıştır.

### 3.3. Yapay Zeka ve Veri Fabrikası Esnekliği (Data Factory)
*   `softwares` ve `software_translations` tablolarına eklenen `ai_features (jsonb)` kolonu, esnek (schemaless) veri saklama yeteneği sağlar. Kalite kapısından (Quality Gate) geçen SEO ve yapay zeka içerikleri sistemi bozmadan doğrudan işlenebilir.
*   `alternatives` tablosuna eklenen `core_difference` ve `is_indexable` alanları, hangi karşılaştırmaların indeksleneceğini belirleyerek SEO stratejisinin (Crawl Budget) mükemmel yönetilmesini sağlar.

### 3.4. Vektörel Arama (Semantic Search)
*   Vektör tabanlı yapay zeka aramaları için `software_embeddings` tablosu (`embedding` ve `embedding_768` tipleriyle) entegre edilmiştir.

## 4. Next.js Frontend İskeleti
Uygulama katmanında dinamik rotalar ve servislerin temelleri atılmıştır:
*   `/src/app/[locale]/page.tsx`: Çok dilli ana sayfa.
*   `/src/app/[locale]/[slug]/page.tsx`: Yazılım profil/detay sayfası.
*   `/src/app/[locale]/[slug]/vs/[alternative_slug]/page.tsx`: Yazılım karşılaştırma (A vs B) sayfaları.
*   `/src/lib/services/translationService.ts`: Çeviri yönetim servisi.

## 5. Mevcut Aşama
Veritabanı (Supabase) katmanı tamamlanmış ve canlıya çıkmaya (Production-Ready) hazır hale getirilmiştir. Sıradaki aşama için Next.js önyüz geliştirmesi veya Data Factory tohum verilerinin basılması arasında seçim yapılacaktır.
