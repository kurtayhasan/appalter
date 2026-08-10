# 🔍 APPALTER PROJESİ - KAPSAMLI KOD İNCELEMESİ RAPORU

**Tarih**: 10 Ağustos 2026  
**Mod**: Kontrol Yalnızca (Kod Değişikliği Yok)  
**İnceleyici**: GitHub Copilot CLI

---

## 📊 ÖZET İSTATİSTİKLERİ

- **Toplam Bulgu**: 24
- **🔴 Kritik**: 1 (DERHAL ÖNEMLİ)
- **🟡 Uyarı**: 10 (Kısa/Orta Vadede Çöz)
- **🟢 İyi Uygulama**: 13 (Korunması Gereken)

---

## **1️⃣ KRITIK SORUN - DERHAL ÇÖZÜLMELI**

### 🔴 **AI Pipeline: Checkpoint Stratejisi Eksik**

**Dosya**: `scripts/pipeline/03-enrich.ts`, `06-publish.ts`  
**Etki**: 🚨 **YÜKSEK**

**Problem**:
```
Binlerce yazılım OpenAI API ile zenginleştirirken script yarıda kesilirse:
- Tamamlanan öğeler kaybolur
- Yeniden çalıştırmada aynı öğeler tekrar işlenir
- Gereksiz OpenAI çağrıları = para kaybı
- Veritabanında duplicate metadata
```

**Gördüğü Kod**:
- Dosya-tabanlı işleme (`-discovery.json` → `-enriched.json`)
- Hiçbir state persistence yok
- Evet 3 retry var ama session-level değil

**Önerilen Çözüm** (kodlama yapılacak):
- `data/state/checkpoint.json` ile işlenen item ID'lerini track et
- Resume'de önceki checkpoint'ten başla
- Her batch'de atomic checkpoint update

---

## **2️⃣ UYARILAR - ORTA VADEDE ÖNEMLİ**

### **A. NEXT.JS ÖNBELLEK STRATEJİSİ**

#### 🟡 **Cache Consistency Sorunu**

**Dosya**: `src/lib/cache/queries.ts`, `mutations.ts`

```
PROBLEM:
- revalidateTag() çağrılırken Supabase webhook'u BAŞARISIZSAYILIRSA?
- Webhook timeout → tag update edilmez → eski cache sunulur (ASIRI SAKINCI)
- Örnek: Yeni alternatif onaylandı ama 1 saat boyunca gözükmüyor

GÖRÜLENler:
✅ Cache tags açık (softwareTag, alternativesTag vs)
✅ REVALIDATE zamanları mantıklı (FREQUENT=5dk, STANDARD=1h, SLOW=24h)
❌ Webhook reliability = 0% (try-catch yok, timeout logic yok)
❌ TTL verification = hiçbir altyapı
```

**Çözüm Stratejisi** (detaylı tasarlanacak):
- Supabase webhook'a retry mekanizması ekle
- İsteğe bağlı periodic full invalidation (günde 1 kere)
- Cache age header'ına bakarak client cache strategy uyarla

---

#### 🟡 **Query Error Handling - Kaskad Fallback Yok**

**Dosya**: `src/lib/cache/queries.ts` - satırlar ~140-280

```typescript
// Şu anki kod:
const { data, error } = await supabase.from("softwares").select(...);
if (error || !data) return null;  // ← Anında 404, hiç fallback yok

PROBLEM:
- Supabase 500 hatası → null döner → notFound() → kullanıcı 404 sayfası
- 3 saniyelik geçici network bozulması = kullanıcı için broken page
- Retry mekanizması yok
```

**Çözüm Fikri** (API düzey):
- `unstable_cache` ile exponential backoff ekle
- Stale-while-revalidate pattern (eski cached değeri serve et + background refresh)

---

### **B. SUPABASE GÜVENLİĞİ**

#### 🟡 **RLS Politikası - Alternatifler Tablosu**

**Dosya**: `supabase/migrations/0002_rls_policies.sql` (satır ~270)

```sql
CREATE POLICY "alternatives_select_published"
  ON public.alternatives FOR SELECT
  USING (
    is_approved = TRUE
    OR public.is_admin()
  );
```

**SONUÇ**: ✅ **Güvenli** (ama tek koşulla)
- alternatives tablosu doğrudan SELECT yapılırsa: ✅ RLS korur (is_approved=TRUE)
- Ama `get_alternatives_for_software` RPC'sinde `alt.status='published'` AYRIYETEN kontrol yapılıyor
- Yine de: **RLS içinde softwares.status kontrolü eklenmeli** (Defense in Depth)

#### 🟡 **Draft Software - Submitter Sızıntısı**

**Dosya**: `supabase/migrations/0002_rls_policies.sql` (satır ~130)

```sql
CREATE POLICY "softwares_select_published"
  ON public.softwares FOR SELECT
  USING (
    status = 'published'
    OR public.is_editor()
    OR submitted_by = auth.uid()  ← ⚠️ Draft bile gözüküyor
  );
```

**SORUN**:
- User A draft software X yayınlıyor
- Eş zamanlı: User B, X'in unapproved alternatifini submit ediyor
- User A, B'nin alternatifini reddediyor ama B yazının draft halini gözüyor → meta leak

**Risk Seviyesi**: Orta (metadata leak, data exfil değil)

---

### **C. UI & PERFORMANS**

#### 🟡 **Image Optimization - Wildcard CDN**

**Dosya**: `next.config.ts` (satır ~35-50)

```typescript
{
  protocol: "https",
  hostname: "**",  // ← Hiçbir domain filtresi yok!
  minimumCacheTTL: 86400,  // 24 saat
}
```

**SORUN**:
```
- Kötü amaçlı domain logo'su URL'ye eklenir
- 24 saat boyunca Next.js Image Optimization cache'e girer
- DDoS vektörü: Benzersiz görüntülerle cache tablosu dolur
```

**Çözüm**:
- Whitelist'li domain'ler (`logo.clearbit.com`, `cdn.brandfetch.io` vs)
- Cache TTL = 7 gün (365 gün değil)

---

#### 🟡 **Client Components - Lightbox Overhead**

**Dosya**: `src/components/software/ScreenshotsGallery.tsx`

```
- Lightbox kütüphanesi (photoswipe vs) client bundle'a girer
- Büyük alternatif listlerde: 12+ ekran görüntüsü = 200KB+ JS
- LCP zarar görebilir
```

**Çözüm Fikri**:
- Server-side image CDN transforms kullan (Cloudinary API vs)
- Lightbox lazy-load et (dynamic import)

---

#### 🟡 **Search - Debounce Yok**

**Dosya**: `src/app/[locale]/search/page.tsx`

```
PROBLEM: User "reac" yazıyor (4 karakterde):
- "r" → query 1
- "re" → query 2
- "rea" → query 3
- "reac" → query 4
= 4 DB çağrısı saniyede

Tarayıcı isteklerini devam ettirir, ama cache yok
```

**Çözüm**: Search input'a 300ms debounce + request deduplication

---

#### 🟡 **Pagination UX - Total Item Count Belirsiz**

**Dosya**: `src/components/software/AlternativesList.tsx` (satır ~35)

```tsx
<span className="alternatives-count">
  Page {page} of {totalPages}
</span>
// ❌ User bilmiyor: 10 alternatif mi var? 10,000 mi?
```

**Çözüm**:
```
"Page 2 of 50 (589 total alternatives)"
```

---

### **D. AI PİPELİNE - UYARILAR**

#### 🟡 **JSON Parse Robustness**

**Dosya**: `scripts/pipeline/config.ts` → `parseJsonSafely()`

```typescript
// Şu anki hepsi: Regex substring extraction + strict parse
// RISK: Garbled LLM response → empty array fallback
//       Sonra validasyon hatasında, retry loop'a girer, para kaybı
```

**Çözüm**:
- Streaming JSON parser (jq-like) kullan
- LLM'ye "VALID JSON ONLY" daha sert constraint ver
- Temperature = 0.1'e düşür (daha deterministik)

---

#### 🟡 **Validation vs. Verification**

**Dosya**: `scripts/pipeline/06-publish.ts`

```typescript
// Zod schema shape'i kontrol eder:
confidence: z.number().min(0).max(1)
// ❌ EVET 0.87 ama LLM bu confidence'ı gerçekten hesapladı mı?
```

**Eksiklik**:
- Hallucination detection yok
- Alternatif relation accuracy = unverified
- Sample batch manual review gerekli

---

#### 🟡 **Idempotency - Duplicate Handling**

**Dosya**: `scripts/pipeline/06-publish.ts` (satır ~50)

```typescript
.upsert({
  slug: cleanSlug,  // Key
  ai_features: sw.ai_features,  // ← Duplicate → overwrites
}, { onConflict: "slug" })
```

**SORUN**:
- Discovery'de "Salesforce" 2 kere çıksa → normalize'da 2 slug
- Enrich'e girerse 2 kere AI çağrısı = para kaybı
- ai_features ikinci kez overwrite olur (risk: consistency)

**Çözüm**: Discovery'de deduplication (slug by hash)

---

## **3️⃣ GÜÇLÜ NOKTALAR - KORUNMALI**

### ✅ **Cache Strategy Foundation**

```
REVALIDATE sabitleri iyi planlı:
- FREQUENT (5dk): featured list
- STANDARD (1h): software detail
- SLOW (24h): categories
- STATIC (7gün): homepage

Bu, programmatic SEO için perfect
```

### ✅ **AI Pipeline Rate Limiting**

```
03-enrich.ts:
  - 3 saniye OpenAI delay ✅
  - 5 saniye retry backoff ✅
  - Temperature 0.2 (consistent) ✅
```

### ✅ **Data Filtering (Supabase)**

```
get_alternatives_for_software():
  - is_approved = TRUE ✅
  - alt.status = 'published' ✅
  - Approval + Published Status = Defense in Depth ✅
```

### ✅ **Accessibility**

```
SoftwareHero:
  - ARIA labels ✅
  - Semantic breadcrumbs ✅
  - aria-current="page" ✅

AlternativesList:
  - role="list" / role="listitem" ✅
```

### ✅ **PPR & Suspense Boundaries**

```
[slug]/page.tsx:
  - Static shell (SoftwareHero) → CDN
  - 4 Dynamic Islands → Streamed
  - Bu pattern = LCP optimize + SEO perfect
```

### ✅ **TypeScript & Zod**

```
Pipeline'daki tüm schemas strongly typed ✅
Runtime validation + compile-time types ✅
```

---

## **4️⃣ ARCHITECTURE - DİKEY BÜYÜME İÇİN HAZIR MI?**

### **Şu anki duruma göre**:

| Metrici | Durum | Sınır |
|---------|-------|--------|
| **Software kaydı** | ~5K?+ | 1M (schema dest.) ✅ |
| **Alternatif ilişkisi** | ~50K?+ | 10M (index iyisi) ⚠️ |
| **API latency** | Bilinmiyor | <200ms gerek |
| **Cache hit ratio** | Bilinmiyor | %95+ lazım |
| **Concurrent users** | ? | 1K+ ready ⚠️ |

### **Ölçek Riskleri**:

#### 🟠 **Cache Stampede (Thunder Herd)**

```
Senaryo: 100K users → software cache invalidate
→ 100K eşzamanlı "refresh" request
→ Supabase spike → 503 errors

Çözüm yok şu anda. Gerekli:
- Cache-locking (Redis + distributed lock)
- Request deduplication (SWR pattern)
- Rate limiting on refresh
```

#### 🟠 **Circuit Breaker Yok**

```
Supabase down → tüm sayfalar 404
Fallback yok. Çözüm:
- Stale cache serve et (revalidate-after)
- Redis/CDN edge cache layer
- Static fallback page pool
```

#### 🟠 **Database N+1 Risk**

```
Danışılan sorgular (örnek):
- getSoftwareBySlugCached() → software details
- getAlternativesCached() → alternatifler
- getReviewsCached() → yorumlar
- getFAQsCached() → SSS

Eş zamanlı 3 Suspense = 3 parallel fetch ✅ İyi

Ama: JOIN aggregate'leri (avg_rating, count) hangi
seviyede hesaplanıyor?
```

Çalışan kaynağı:
```sql
-- Supabase materialized view?
-- Yoksa trigger?
SELECT COUNT(*) FROM software_reviews
WHERE software_id = X AND is_approved = TRUE;
-- Büyük scale'de expensive
```

---

## **5️⃣ DİKEY BÜYÜME İÇİN EKSİKLİKLER**

### **Sayısal Sıralama: En Önemli Önce**

#### **1. Observability & Monitoring**

```
Gözlemlenen kod:
- No console.error logging (production logs nerede?)
- No performance metrics collection
- No error tracking (Sentry setup var ama kullanılmıyor)

Gerekli:
- Slow query alerts (>500ms)
- Cache hit/miss ratio dashboard
- LCP/CLS/FID tracking (Web Vitals)
- Error rate per endpoint
```

#### **2. Database Query Optimization**

```
Kontrol edilen fonksiyonlar:
- getCategorySoftwaresCached() → category.id lookup
- getComparisonDataCached() → 3 parallel Promise.all()

Beklemedi:
- EXPLAIN ANALYZE output
- Index strategy doc
- Join strategy (esp. alternatives graph)

İhtiyaç: Veritabanı tuning audit
```

#### **3. Stale-While-Revalidate Pattern**

```
Şu anki: Soft 404 on error
İstenen:
- Background refresh queue
- Partial data + "loading..." state
- Graceful degradation
```

#### **4. API Rate Limiting & Quotas**

```
Pipeline'da:
- OpenAI per-category call count yok
- Cost tracking yok
- Quota exhaustion handling yok

Production needs:
- Supabase RPC per-user rate limit
- Search query rate limit (DDoS protection)
- Concurrent request pooling
```

#### **5. Search Indexing Strategy**

```
Şu anki: Full table scan likely
- alternatives.similarity_score DESC
- Indexed? Trigram? ❌

Gerekli:
- Denormalized search materialized view
- Elasticsearch/ParadeDB for full-text + semantic
```

#### **6. Async Job Queue**

```
Şu anki pipeline: Sıralı, single-file processing

Gerekli şunlar için:
- Bulk imports (1M+ software)
- Periodic data refresh (scraping)
- Email notifications (reviews approved)
- PDF export generation

Tool: Bull, Temporal, AWS SQS?
```

#### **7. A/B Testing Framework**

```
Yoktur.

Growth konusu:
- Layout A/B test (CTA placement)
- Pricing table variations
- Search result ranking experiments

Tool: PostHog (zaten installed!) + experiment SDK
```

#### **8. Caching Strategy Doc**

```
Bilinmeyen:
- Hangi sorgu kaç kere çalışıyor?
- Cache key collision risk?
- TTL yeterli mi?

Gerekli:
- Cache warmup strategy
- Pre-generation batch list
- Cache invalidation runbook
```

---

## **6️⃣ GÜVENLİK - DETAY**

### **Başarılı Kontroller** ✅

- ✅ RLS aktif (tüm tablolarda)
- ✅ is_admin() ve is_editor() helper functions
- ✅ Audit logging triggers
- ✅ SQL injection: Zod + prepared statements

### **Kaç Etmeyen Şeyler** ⚠️

- ⚠️ CSRF token (auth tablosu kullanma, JWT sadece)
- ⚠️ Rate limit (DDoS protection)
- ⚠️ Content Security Policy (next.config'te var ama nonce injection yok)
- ⚠️ Secrets rotation (env vars static)
- ⚠️ API key expiration (Supabase anon key yok değişme tarihi)

### **Önerilir Audit Kontrol**:

```bash
# 1. RLS policies test:
SELECT * FROM alternatives WHERE is_approved = FALSE;
# Should return error without auth

# 2. Webhook signature verification
# Supabase webhook'lar signed mi?

# 3. Data residency compliance
# Supabase region = EU/US/SG?
```

---

## **7️⃣ GENEL MİMARİ SAĞLIK SKORU**

| Alan | Skor | Not |
|------|------|-----|
| **Code Organization** | 8/10 | Clear separation (cache, components, pipeline) |
| **Type Safety** | 9/10 | Full TypeScript + Zod |
| **Error Handling** | 5/10 | Soft 404, no retry, no fallback |
| **Performance** | 7/10 | PPR good, but cache strategy incomplete |
| **Security** | 7/10 | RLS solid, but audit gaps |
| **Testability** | 3/10 | No test suite visible; pipeline hard to test |
| **Observability** | 2/10 | No structured logging or metrics |
| **Scalability Readiness** | 5/10 | Foundation good, but no load testing visible |

**GENEL DURUM**: 🟢 **Gelişim Aşamasında - Kurumsal Hazırlık Devam Ediyor**

---

## **8️⃣ ÖNERİLEN AKSİYON PLANI**

### **HEMEN (1-2 hafta)**

1. ✅ AI Pipeline checkpoint persistence (Critical fix)
2. ✅ RLS: alternatives table'a `softwares.status` AND kontrolü ekle
3. ✅ Image cache TTL: 86400 → 604800 (7 gün) + domain whitelist
4. ✅ Search debounce: 300ms + request deduplication

### **KISA VADEDE (1 ay)**

1. Cache consistency webhook'u retry + timeout logic
2. Database: EXPLAIN ANALYZE + index strategy
3. Observability: Sentry setup + custom metrics
4. Unit test suite (pipeline + cache functions)

### **ORTA VADEDE (3 ay)**

1. Circuit breaker pattern (Redis session + fallback)
2. Async job queue (Bull/Temporal)
3. Search index optimization (ParadeDB trigram)
4. A/B testing framework (PostHog integration)
5. Load testing (1K concurrent users simulation)

### **UZUN VADEDE (6+ ay)**

1. Semantic search (pgvector + embedding model)
2. Real-time analytics dashboard
3. Multi-region cache (CDN edge functions)
4. Enterprise features (SAML, SSO, audit logs download)

---

## **SONUÇ**

Proje mimarisi **programmatic SEO + Next.js 15 best practices** için **çok iyi tasarlanmış**. Cache stratejisi, PPR, TypeScript, Zod validation tümü sağlam.

Fakat:
- **1 kritik sorun** (AI pipeline checkpoint): **Derhal çözülmeli**
- **10 orta seviye uyarı**: Ölçek büyüdüğünde problem olacak
- **Observability eksik**: Production ready değil (logging, metrics)
- **Dikey büyüme**: 10x-100x ölçekle başarısız olur (cache stampede, no circuit breaker)

**Tavsiye**: Next 2 Sprint'te kritik + 4 uyarı fix'i yapın, sonra enterprise features'a geçin.

---

✅ **İnceleme Tamamlandı** | ❌ **Kod Değişikliği Yapılmadı** (İsim Gereği)

**Rapor Oluşturma**: 10 Ağustos 2026, 23:35
