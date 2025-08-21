import { GoogleGenAI, Type } from "@google/genai";
import type { ReportSection } from '../types';

function getAiClient(): GoogleGenAI {
  const userApiKey = localStorage.getItem('user_api_key');
  const apiKey = userApiKey || process.env.API_KEY;

  if (!apiKey) {
    throw new Error("API Anahtarı bulunamadı. Lütfen ayarlardan kendi anahtarınızı girin veya ortam değişkenini yapılandırın.");
  }
  return new GoogleGenAI({ apiKey });
}


export type ReportLength = 'short' | 'normal' | 'long';

export interface GenerationOptions {
    includeContributors: boolean;
    length: ReportLength;
}

export async function generateReportOutline(topic: string): Promise<string[]> {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Bana '${topic}' konusu hakkında kapsamlı bir rapor için bir içindekiler tablosu oluştur. Sadece bölüm başlıklarını içeren bir JSON dizisi olarak yanıt ver. Örnek: ["Giriş", "Tarihçe", "Temel Kavramlar", "Sonuç"]. En az 4 bölüm başlığı oluştur.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
            description: "Raporun bölüm başlığı",
          },
        },
      },
    });
    
    const jsonString = response.text.trim();
    const outline = JSON.parse(jsonString);
    return Array.isArray(outline) ? outline : [];
  } catch (error) {
    console.error("Error generating report outline:", error);
    throw new Error("İçindekiler tablosu oluşturulurken bir hata oluştu.");
  }
}


export async function generateSectionContent(topic: string, sectionTitle: string, options: GenerationOptions): Promise<string> {
    try {
        const ai = getAiClient();
        let lengthPrompt = '';
        switch (options.length) {
            case 'short':
                lengthPrompt = "kısa, anlaşılır ve özet niteliğinde bir metin yaz. Yalnızca en temel ve can alıcı noktalara odaklan.";
                break;
            case 'long':
                lengthPrompt = `Bu bölüm için, adeta bir başyapıt niteliğinde, bir başvuru eseri, bir manifesto ve bir akademik tezin birleşimi olan, son derece derin, kapsamlı ve aydınlatıcı bir metin oluştur. Metin, sadece bilgi vermekle kalmamalı, aynı zamanda okuyucuyu konunun içine çekmeli, düşünmeye sevk etmeli ve ona ilham vermelidir. Bu metni oluştururken aşağıdaki direktifleri en üst düzeyde titizlikle uygula:

1.  **Aşamalı ve Pedagojik Anlatım (ELi5'ten Uzman Seviyesine):** Metne, konuyu daha önce hiç duymamış zeki bir lise öğrencisinin bile anlayabileceği temel bir girişle başla. Ardından, katman katman derinleşerek, konuyu bir lisansüstü öğrencisinin tezine referans olarak kullanabileceği bir seviyeye taşı. Her teknik terim, jargon veya karmaşık konsept, ilk kullanıldığı yerde net bir şekilde tanımlanmalıdır. Sadece tanımlamakla kalma, konunun daha iyi kavranması için en az iki farklı, yaratıcı, somut ve akılda kalıcı **analoji veya metafor** kullan. Örneğin, 'Kara delikleri, evrenin en dibindeki bir gider gibi düşünebiliriz... Bir başka deyişle, uzay-zaman dokusunda yırtılmış bir pelerin gibidir...'.

2.  **Kapsamlı Tarihsel ve Sosyo-Kültürel Bağlam:** Konuyu sadece 'ne olduğu' üzerinden değil, 'neden ve nasıl o hale geldiği' üzerinden anlat. Fikrin veya teknolojinin tarihsel kökenlerine in. Hangi toplumsal, politik veya bilimsel iklimde doğduğunu analiz et. Bu süreçteki ana karakterleri, sadece bilinen isimleri değil, aynı zamanda haksızlığa uğramış veya unutulmuş öncüleri de anlatarak hikayeleştir. Önemli dönüm noktalarını ve bu noktaların konunun yörüngesini nasıl değiştirdiğini vurgula.

3.  **Diyalektik ve Eleştirel Analiz:** Konuyla ilgili tüm ana akım, alternatif ve radikal teorileri adil bir şekilde temsil et. Her bir teorinin temel argümanlarını, varsayımlarını ve kanıtlarını sun. Ardından, bu teorileri birbiriyle 'konuştur'. Birbirlerine nasıl cevap verdiklerini, hangi noktalarda ayrışıp hangi noktalarda birleştiklerini göster. Her bir yaklaşımın güçlü ve zayıf yönlerini, kör noktalarını ve potansiyelini objektif bir dille, derinlemesine karşılaştır. Güncel akademik tartışmaların bir özetini sun.

4.  **Çok Yönlü Uygulama ve Vaka İncelemeleri:** Teorik bilgileri, gerçek hayattan alınmış, detaylı ve farklı sektörlerden (örn: tıp, sanat, finans, mühendislik) en az üç **vaka incelemesi (case study)** ile somutlaştır. Bu vakalarda konunun pratikte nasıl işlediğini, hangi beklenmedik sonuçlar doğurduğunu ve hangi zorluklarla karşılaşıldığını adım adım anlat.

5.  **Disiplinlerarası Köprüler:** Konunun sınırlarını aş. Bu konseptin, ilk bakışta alakasız görünen diğer bilgi alanlarıyla (felsefe, sosyoloji, sanat, ekonomi, psikoloji vb.) nasıl etkileşime girdiğini ve onlardan nasıl etkilendiğini gösteren bağlantılar kur. Bu disiplinlerarası bakış açısı, konunun bütüncül bir resmini çizmeli.

6.  **Gelecek Projeksiyonu ve Senaryo Analizi:** Bölümün sonunda, sadece basit bir gelecek tahmini yapma. Konunun evrimine dair **kısa (1-5 yıl), orta (5-15 yıl) ve uzun (15+ yıl) vadeli** potansiyel senaryolar oluştur. Hem iyimser (ütopik) hem de kötümser (distopik) gelecek olasılıklarını, bu olasılıkları tetikleyebilecek faktörlerle birlikte analiz et.

7.  **Derinlemesine Etik ve Felsefi Boyut:** Eğer konuyla ilgiliyse, ortaya çıkan etik, sosyal ve felsefi ikilemleri yüzeysel bir şekilde geçiştirme. Bu sorunları farklı etik çerçeveler (örn: faydacılık, deontoloji, erdem etiği) üzerinden analiz et. 'Bu teknolojiden kim fayda sağlar, kim zarar görür?', 'İnsan olmanın anlamını nasıl değiştirir?' gibi temel soruları sor ve olası cevapları tartış.

8.  **Anlatısal Akıcılık ve Edebi Üslup:** Metin, kuru bir bilgi yığını olmamalıdır. Okuyucuyu başından sonuna kadar sürükleyen, mantıksal bir akışa ve anlatısal bir yapıya sahip olmalıdır. Merak uyandıran bir giriş, doyurucu bir gelişme ve düşündürücü bir sonuç içermelidir. Zengin bir kelime dağarcığı ve akıcı bir edebi dil kullan. Metni, kendi içinde alt başlıklar içerebilecek şekilde yapılandırılmış paragraflarla organize et.`;
                break;
            case 'normal':
            default:
                lengthPrompt = "son derece ayrıntılı, derinlemesine ve ansiklopedik bir dille bir metin yaz. Konuyu hiç bilmeyen birine dahi anlatacak netlikte olmalı.";
                break;
        }

        let prompt = `'${topic}' ana konusu üzerine hazırlanan bir raporun '${sectionTitle}' bölümü için, ${lengthPrompt} Metin, akıcı paragraflar halinde ve profesyonel bir üslupla yazılmalıdır. Markdown veya HTML etiketleri kullanma, sadece düz metin oluştur.`;

        if (options.includeContributors) {
            prompt += `\n\nAyrıca, bu bölümle ilgili kilit isimleri, bilim insanlarını veya düşünürleri ve onların bu konudaki temel katkılarını ve keşif süreçlerini ayrıntılı bir şekilde 'Kilit İsimler ve Katkıları' başlığı altında anlat.`;
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error(`Error generating content for section "${sectionTitle}":`, error);
        throw new Error(`'${sectionTitle}' bölümü için içerik oluşturulurken bir hata oluştu.`);
    }
}

export async function generateSectionImage(topic: string, sectionTitle: string): Promise<string> {
    const placeholderImageUrl = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%221280%22%20height%3D%22720%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Crect%20width%3D%221280%22%20height%3D%22720%22%20fill%3D%22%23374151%22%20/%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%20font-size%3D%2248%22%20fill%3D%22%239ca3af%22%3EG%C3%B6rsel%20olu%C5%9Fturulamad%C4%B1%3C/text%3E%3C/svg%3E';
    
    try {
        const ai = getAiClient();
        const prompt = `Profesyonel bir rapor için etkileyici bir görsel: '${topic}, ${sectionTitle}'. Fotoğraf gerçekliğinde, sinematik, metin veya insan olmadan.`;
        
        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '16:9',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        }
        
        console.warn(`No image generated for section "${sectionTitle}", using placeholder.`);
        return placeholderImageUrl;

    } catch (error) {
        console.error(`Error generating image for section "${sectionTitle}":`, error);
        return placeholderImageUrl;
    }
}

export async function generateFullSection(topic: string, sectionTitle: string, options: GenerationOptions): Promise<ReportSection> {
    try {
        const [content, imageUrl] = await Promise.all([
            generateSectionContent(topic, sectionTitle, options),
            generateSectionImage(topic, sectionTitle)
        ]);
        return { title: sectionTitle, content, imageUrl };
    } catch (error) {
        console.error(`Error generating full section for "${sectionTitle}":`, error);
        throw new Error(`Bölüm '${sectionTitle}' oluşturulurken bir hata meydana geldi.`);
    }
}