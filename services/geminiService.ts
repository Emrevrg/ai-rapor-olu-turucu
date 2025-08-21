import { GoogleGenAI, Type } from "@google/genai";
import type { ReportSection, GenerationOptions } from '../types';

function getAiClient(): GoogleGenAI {
  const userApiKey = localStorage.getItem('user_api_key');
  const apiKey = userApiKey || process.env.API_KEY;

  if (!apiKey) {
    throw new Error("API Anahtarı bulunamadı. Lütfen ayarlardan kendi anahtarınızı girin veya ortam değişkenini yapılandırın.");
  }
  return new GoogleGenAI({ apiKey });
}

function createPlaceholderImage(title: string, prompt: string): string {
    const bgColor = '#374151'; // dark:bg-gray-700
    const textColor = '#d1d5db'; // dark:text-gray-300
    const cleanTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const cleanPrompt = prompt.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const maxCharsPerLine = 75;
    const words = cleanPrompt.split(' ');
    const lines = [];
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
        if (currentLine.length + words[i].length + 1 <= maxCharsPerLine) {
            currentLine += ` ${words[i]}`;
        } else {
            lines.push(currentLine);
            currentLine = words[i];
        }
    }
    lines.push(currentLine);

    const promptTSpans = lines.map((line, index) => `<tspan x="50%" dy="${index === 0 ? '2.5em' : '1.5em'}">${line}</tspan>`).join('');

    const svg = `<svg width="1280" height="720" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" style="background-color:${bgColor};">
        <text x="50%" y="40%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="60px" fill="${textColor}" font-weight="bold">${cleanTitle}</text>
        <text x="50%" y="40%" dy="1.5em" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24px" fill="${textColor}" opacity="0.7">Görsel oluşturulamadı</text>
        <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="16px" fill="${textColor}" opacity="0.6">
            <tspan x="50%" dy="0em" font-weight="bold">Kullanılan Prompt:</tspan>
            ${promptTSpans}
        </text>
    </svg>`;
    
    const base64EncodedSvg = btoa(
        encodeURIComponent(svg).replace(/%([0-9A-F]{2})/g, (match, p1) =>
            String.fromCharCode(parseInt(p1, 16))
        )
    );
    
    return `data:image/svg+xml;base64,${base64EncodedSvg}`;
}

export interface ImageGenerationResult {
    imageUrl: string;
    imageError: string | null;
    imagePrompt: string;
    isPlaceholder: boolean;
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

export async function generateSectionImage(topic: string, sectionTitle: string): Promise<ImageGenerationResult> {
    const prompt = `An impressive, professional, photorealistic, cinematic image for a report on the topic of '${topic} - ${sectionTitle}'. The image should be abstract and conceptual, avoiding text or visible people.`;
    try {
        const ai = getAiClient();
        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '16:9',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0 && response.generatedImages[0].image?.imageBytes) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return {
                imageUrl: `data:image/jpeg;base64,${base64ImageBytes}`,
                imageError: null,
                imagePrompt: prompt,
                isPlaceholder: false
            };
        }
        
        const errorMessage = "API yanıt verdi ancak görsel verisi bulunamadı.";
        console.error(`'${sectionTitle}' için görsel oluşturulamadı. Hata: ${errorMessage}`);
        return {
            imageUrl: createPlaceholderImage(sectionTitle, prompt),
            imageError: errorMessage,
            imagePrompt: prompt,
            isPlaceholder: true
        };

    } catch (error) {
        const originalErrorMessage = error instanceof Error ? error.message : String(error);
        console.error(`'${sectionTitle}' için görsel oluşturulamadı. Hata: ${originalErrorMessage}.`);
        return {
            imageUrl: createPlaceholderImage(sectionTitle, prompt),
            imageError: originalErrorMessage,
            imagePrompt: prompt,
            isPlaceholder: true
        };
    }
}

export async function generateFullSection(topic: string, sectionTitle: string, options: GenerationOptions): Promise<[ReportSection, string | null]> {
    try {
        const [content, imageResult] = await Promise.all([
            generateSectionContent(topic, sectionTitle, options),
            generateSectionImage(topic, sectionTitle)
        ]);

        const section: ReportSection = { 
            title: sectionTitle, 
            content, 
            imageUrl: imageResult.imageUrl,
            isPlaceholder: imageResult.isPlaceholder,
            imagePrompt: imageResult.imagePrompt
        };
        return [section, imageResult.imageError];
    } catch (error) {
        console.error(`Error generating full section for "${sectionTitle}":`, error);
        throw error;
    }
}