import React, { useState, useCallback, Fragment, useRef, useEffect } from 'react';
import type { Report, ReportSection, GenerationOptions, ReportLength, OutputFormat } from './types';
import { generateReportOutline, generateFullSection } from './services/geminiService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


// --- ICONS ---
const DocumentIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);
const MagicWandIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M17.293 2.293a1 1 0 011.414 0l.001.001a1 1 0 010 1.414l-1.586 1.586a1 1 0 01-1.217.242l-1.382-.592a1 1 0 00-1.217.242L12 6.586l-2.293-2.293a1 1 0 010-1.414l.001-.001a1 1 0 011.414 0l1.586 1.586a1 1 0 01.242 1.217l-.592 1.382a1 1 0 00.242 1.217L14.414 8l1.293-1.293a1 1 0 011.414 0l.293.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-1.293-1.293a1 1 0 00-1.414 0l-.293.293a1 1 0 000 1.414l4 4a1 1 0 010 1.414l-.293.293a1 1 0 01-1.414 0L10 15.414l-1.293 1.293a1 1 0 01-1.414 0l-.001-.001a1 1 0 010-1.414l1.586-1.586a1 1 0 011.217-.242l1.382.592a1 1 0 001.217-.242L14 11.414l2.293 2.293a1 1 0 010 1.414l-.001.001a1 1 0 01-1.414 0l-1.586-1.586a1 1 0 01-.242-1.217l.592-1.382a1 1 0 00-.242-1.217L11.586 10 7.293 5.707a1 1 0 010-1.414l.293-.293a1 1 0 011.414 0L10 5.586l1.293-1.293a1 1 0 011.414 0l.001.001a1 1 0 010 1.414L11.414 7l2.293 2.293a1 1 0 001.414 0l.293-.293a1 1 0 000-1.414l-4-4a1 1 0 010-1.414l.293-.293a1 1 0 011.414 0L17.293 2.293z" />
    </svg>
);
const RefreshIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.899 2.186l-1.414.707a5.002 5.002 0 00-8.854-1.614V6a1 1 0 11-2 0V3a1 1 0 011-1zm12 15a1 1 0 01-1-1v-2.101a7.002 7.002 0 01-11.899-2.186l1.414-.707a5.002 5.002 0 008.854 1.614V14a1 1 0 112 0v3a1 1 0 01-1 1z" clipRule="evenodd" />
    </svg>
);
const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);
const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);
const MoonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
);
const CogIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);
const HistoryIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v1.586m0 0v1.586m0-1.586h0zm5.338-3.57a4.5 4.5 0 00-6.364-6.364M12 18.753v-1.586m0 0v-1.586m0 0h0m-5.338 3.57a4.5 4.5 0 006.364 6.364M18.364 5.636l-1.06 1.06M6.707 17.293l-1.06-1.06" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.253A4.5 4.5 0 0116.5 12.753v0a4.5 4.5 0 01-4.5 4.5v0a4.5 4.5 0 01-4.5-4.5v0A4.5 4.5 0 0112 8.253v0z" />
    </svg>
);
const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);
const InfoIcon = ({ className = "h-6 w-6 mr-2" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);


// --- COMPONENTS ---
const GenerationForm: React.FC<{
    onGenerate: (topic: string) => void;
    isLoading: boolean;
    onReset: () => void;
    reportExists: boolean;
    options: GenerationOptions;
    setOptions: React.Dispatch<React.SetStateAction<GenerationOptions>>;
}> = ({ onGenerate, isLoading, onReset, reportExists, options, setOptions }) => {
    const [topic, setTopic] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (reportExists) {
            onReset();
            setTopic('');
            inputRef.current?.focus();
            return;
        }
        if (topic.trim() && !isLoading) {
            onGenerate(topic);
        }
    };

    const handleOptionChange = (key: keyof GenerationOptions, value: boolean | ReportLength | OutputFormat) => {
        setOptions(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="w-full max-w-2xl mx-auto mb-12 space-y-6">
            <form onSubmit={handleSubmit} className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder={reportExists ? "Yeni bir rapor oluşturmak için butona tıklayın" : "Örn: 'Kuantum Fiziğinin Temelleri'"}
                    className="w-full pl-4 pr-44 py-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300"
                    disabled={isLoading || reportExists}
                />
                <button
                    type="submit"
                    disabled={isLoading || (!reportExists && !topic.trim())}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-2.5 px-6 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                    {isLoading ? 'Oluşturuluyor...' : (reportExists ? 'Yeni Rapor' : 'Oluştur')}
                    {!isLoading && (reportExists ? <RefreshIcon /> : <MagicWandIcon />)}
                </button>
            </form>
            
            <div className={`p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 transition-opacity duration-300 ${reportExists || isLoading ? 'opacity-50' : ''}`}>
                <h3 className="text-center font-semibold text-gray-700 dark:text-gray-300 mb-4">Özelleştirme</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Rapor Uzunluğu</label>
                        <div className="flex flex-col space-y-2">
                            {(['short', 'normal', 'long'] as ReportLength[]).map(len => (
                                <label key={len} className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 cursor-pointer">
                                    <input type="radio" name="length" value={len} checked={options.length === len}
                                        onChange={() => handleOptionChange('length', len)}
                                        disabled={isLoading || reportExists}
                                        className="w-4 h-4 text-cyan-600 bg-gray-100 border-gray-300 focus:ring-cyan-500 dark:focus:ring-cyan-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                    <span>{len === 'short' ? 'Kısa' : len === 'normal' ? 'Normal' : 'Uzun'}</span>
                                 </label>
                            ))}
                        </div>
                    </div>
                     <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Çıktı Formatı</label>
                         <div className="flex flex-col space-y-2">
                            {(['pdf', 'word'] as OutputFormat[]).map(format => (
                                <label key={format} className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 cursor-pointer">
                                    <input type="radio" name="outputFormat" value={format} checked={options.outputFormat === format}
                                        onChange={() => handleOptionChange('outputFormat', format)}
                                        disabled={isLoading || reportExists}
                                        className="w-4 h-4 text-cyan-600 bg-gray-100 border-gray-300 focus:ring-cyan-500 dark:focus:ring-cyan-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                    <span>{format === 'pdf' ? 'PDF' : 'Word (.docx)'}</span>
                                 </label>
                            ))}
                        </div>
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Ek Seçenekler</label>
                         <label className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={options.includeContributors}
                                onChange={(e) => handleOptionChange('includeContributors', e.target.checked)}
                                disabled={isLoading || reportExists}
                                className="w-4 h-4 text-cyan-600 bg-gray-100 border-gray-300 rounded focus:ring-cyan-500 dark:focus:ring-cyan-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <span>Katkıda Bulunanlar</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

const LoadingIndicator: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex flex-col items-center justify-center text-center py-10">
        <svg className="animate-spin h-10 w-10 text-cyan-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">{message}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Bu işlem birkaç dakika sürebilir, lütfen bekleyin.</p>
    </div>
);

const ReportDisplay: React.FC<{ 
    report: Report; 
    setReport: React.Dispatch<React.SetStateAction<Report | null>>;
    showToast: (message: string) => void;
    outputFormat: OutputFormat;
}> = ({ report, setReport, showToast, outputFormat }) => {
    const reportRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleContentChange = (sectionIndex: number, newContent: string) => {
        const updatedSections = [...report.sections];
        updatedSections[sectionIndex].content = newContent;
        setReport({ ...report, sections: updatedSections });
    };

    const handleTocClick = (e: React.MouseEvent<HTMLAnchorElement>, index: number) => {
        e.preventDefault();
        const sectionEl = document.getElementById(`section-${index}`);
        if (sectionEl) {
            sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            showToast("Bu bölüm henüz oluşturuluyor. Lütfen bekleyin.");
        }
    };
    
    const handleDownloadPdf = async () => {
        if (!reportRef.current) return;
        setIsDownloading(true);
        try {
            const reportElement = reportRef.current;
            const images = Array.from(reportElement.querySelectorAll('img'));
            await Promise.all(images.map(img => !img.complete ? new Promise(resolve => { img.onload = img.onerror = resolve; }) : Promise.resolve()));
            await new Promise(resolve => setTimeout(resolve, 500));

            const isDark = document.documentElement.classList.contains('dark');
            const canvas = await html2canvas(reportElement, {
                scale: 2,
                useCORS: true,
                backgroundColor: isDark ? '#111827' : '#ffffff',
                allowTaint: true,
            });
            
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = pdfWidth / imgWidth;
            const canvasHeightInPdf = imgHeight * ratio;
            
            let heightLeft = canvasHeightInPdf;
            let position = 0;

            pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, canvasHeightInPdf);
            heightLeft -= pdf.internal.pageSize.getHeight();

            while (heightLeft > 0) {
                position = heightLeft - canvasHeightInPdf;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, canvasHeightInPdf);
                heightLeft -= pdf.internal.pageSize.getHeight();
            }
            pdf.save(`${report.topic.replace(/\s/g, '_')}.pdf`);
        } catch (error) {
            console.error("PDF oluşturulurken hata oluştu:", error);
            showToast("PDF oluşturulurken bir hata oluştu. Lütfen konsolu kontrol edin.");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDownloadDocx = async () => {
        if (!reportRef.current) return;
        setIsDownloading(true);
        try {
            const htmlToDocx = (await import('html-to-docx')).default;

            const inlineStyles = {
                h1: `font-size: 28px; font-family: Calibri, sans-serif; font-weight: bold; text-align: center; color: #111827; margin-bottom: 8px;`,
                h1_p: `font-size: 14px; font-family: Calibri, sans-serif; text-align: center; color: #0ea5e9; margin-top: 0;`,
                h2: `font-size: 22px; font-family: Calibri, sans-serif; font-weight: bold; color: #111827; margin-top: 28px; margin-bottom: 14px; border-bottom: 2px solid #0ea5e9; padding-bottom: 4px;`,
                img: `max-width: 550px; height: auto; display: block; margin: 16px auto;`,
                p: `font-size: 12pt; font-family: Calibri, sans-serif; line-height: 1.5; color: #374151;`,
                toc_h2: `font-size: 20px; font-family: Calibri, sans-serif; font-weight: bold; color: #0891b2; margin-bottom: 16px;`,
                toc_ul: `list-style-type: decimal; padding-left: 20px;`,
                toc_li: `font-size: 12pt; font-family: Calibri, sans-serif; color: #374151; margin-bottom: 8px;`
            };
    
            let htmlString = `
                <h1 style="${inlineStyles.h1}">${report.topic}</h1>
                <p style="${inlineStyles.h1_p}">Yapay Zeka Tarafından Oluşturulan Detaylı Rapor</p>
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-top: 32px; margin-bottom: 32px;">
                    <h2 style="${inlineStyles.toc_h2}">İçindekiler</h2>
                    <ul style="${inlineStyles.toc_ul}">
                        ${report.sections.map(s => `<li style="${inlineStyles.toc_li}">${s.title}</li>`).join('')}
                    </ul>
                </div>
                ${report.sections.map(section => `
                    <div>
                        <h2 style="${inlineStyles.h2}">${section.title}</h2>
                        <img src="${section.imageUrl}" alt="${section.title} için görsel" style="${inlineStyles.img}" />
                        <p style="${inlineStyles.p}">${section.content.replace(/\n/g, '<br />')}</p>
                    </div>
                `).join('')}`;
            
            const fileBuffer = await htmlToDocx(htmlString, null, {
                orientation: 'portrait',
                margins: { top: 720, right: 720, bottom: 720, left: 720 }, // 1 inch margins
            });
    
            const blob = new Blob([fileBuffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${report.topic.replace(/\s/g, '_')}.docx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

        } catch (err) {
            console.error("Word dosyası oluşturulurken hata oluştu:", err);
            showToast("Word dosyası oluşturulurken bir hata oluştu.");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleCopyPrompt = (prompt: string | undefined) => {
        if (!prompt) return;
        navigator.clipboard.writeText(prompt)
            .then(() => showToast("Prompt panoya kopyalandı!"))
            .catch(err => showToast("Hata: Prompt kopyalanamadı."));
    };

    return (
        <div className="w-full max-w-5xl mx-auto animate-fade-in">
            <div ref={reportRef} className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
                <header className="p-8 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white text-center tracking-tight">{report.topic}</h1>
                    <p className="text-center text-blue-500 dark:text-blue-300 mt-2">Yapay Zeka Tarafından Oluşturulan Detaylı Rapor</p>
                </header>

                <div className="p-4 md:p-8 space-y-12">
                    <div className="bg-gray-100 dark:bg-gray-700/50 p-6 rounded-lg">
                        <h2 className="text-2xl font-semibold text-cyan-600 dark:text-cyan-400 mb-4 border-b-2 border-cyan-500 pb-2">İçindekiler</h2>
                        <ul className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                            {report.sections.map((section, index) => (
                                <li key={index}>
                                    <a href={`#section-${index}`} onClick={(e) => handleTocClick(e, index)} className="hover:text-gray-900 dark:hover:text-white hover:underline">{section.title}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {report.sections.map((section, index) => (
                        <Fragment key={index}>
                            <section id={`section-${index}`} className="scroll-mt-20">
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 border-l-4 border-cyan-500 pl-4">{section.title}</h2>
                                <div className="relative aspect-w-16 aspect-h-9 mb-6 rounded-lg overflow-hidden shadow-lg">
                                    <img src={section.imageUrl} alt={`${section.title} için görsel`} className="w-full h-full object-cover" />
                                    {section.isPlaceholder && (
                                        <button 
                                            onClick={() => handleCopyPrompt(section.imagePrompt)}
                                            className="absolute bottom-2 right-2 flex items-center bg-gray-800/60 hover:bg-gray-800/90 text-white text-xs py-1 px-2 rounded-md transition-all backdrop-blur-sm"
                                        >
                                            <CopyIcon />
                                            Prompt'u Kopyala
                                        </button>
                                    )}
                                </div>
                                <div
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleContentChange(index, e.currentTarget.innerText)}
                                    className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/30 p-6 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 whitespace-pre-wrap"
                                    dangerouslySetInnerHTML={{ __html: section.content.replace(/\n/g, '<br />') }}
                                />
                            </section>
                            {index < report.sections.length - 1 && <hr className="border-gray-200 dark:border-gray-700" />}
                        </Fragment>
                    ))}
                </div>
                <footer className="text-center p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500">
                    Rapor, AI Rapor Oluşturucu tarafından oluşturulmuştur.
                </footer>
            </div>
             <div className="mt-8 text-center">
                 {outputFormat === 'pdf' ? (
                     <button
                        onClick={handleDownloadPdf}
                        disabled={isDownloading}
                        className="flex items-center justify-center mx-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                        <DownloadIcon />
                        {isDownloading ? 'İndiriliyor...' : 'Raporu PDF Olarak İndir'}
                    </button>
                 ) : (
                     <button
                        onClick={handleDownloadDocx}
                        disabled={isDownloading}
                        className="flex items-center justify-center mx-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                        <DownloadIcon />
                        {isDownloading ? 'İndiriliyor...' : 'Raporu Word Olarak İndir'}
                    </button>
                 )}
            </div>
        </div>
    );
};

const ApiKeyModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (key: string) => void;
}> = ({ isOpen, onClose, onSave }) => {
    const [key, setKey] = useState('');

    useEffect(() => {
        if(isOpen) {
            setKey(localStorage.getItem('user_api_key') || '');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(key);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md space-y-4 animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">API Anahtarı Ayarları</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><CloseIcon /></button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Uygulama zaten bir API anahtarı ile yapılandırılmış olabilir. Yalnızca kendi özel Gemini API anahtarınızı kullanmak istiyorsanız bu alanı doldurun.
                </p>
                <div>
                    <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gemini API Anahtarınız</label>
                    <input
                        id="apiKey"
                        type="password"
                        value={key}
                        onChange={e => setKey(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        placeholder="API Anahtarını buraya yapıştırın"
                    />
                </div>
                <div className="flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">İptal</button>
                    <button onClick={handleSave} className="px-4 py-2 rounded-md text-white bg-cyan-600 hover:bg-cyan-700 transition-colors">Kaydet</button>
                </div>
            </div>
        </div>
    );
};

const HistoryPanel: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    history: Report[];
    onLoad: (reportId: number) => void;
    onDelete: (reportId: number) => void;
    onClear: () => void;
}> = ({ isOpen, onClose, history, onLoad, onDelete, onClear }) => {
    return (
        <>
            <div className={`fixed inset-0 bg-black/60 z-40 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose}></div>
            <div className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    <header className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                         <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Rapor Geçmişi</h2>
                         <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><CloseIcon /></button>
                    </header>
                    <div className="flex-grow overflow-y-auto p-4 space-y-3">
                        {history.length === 0 ? (
                            <p className="text-center text-gray-500 dark:text-gray-400 mt-8">Henüz rapor oluşturulmadı.</p>
                        ) : (
                            history.map(report => (
                                <div key={report.id} className="group flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <button onClick={() => onLoad(report.id)} className="text-left flex-grow">
                                        <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">{report.topic}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(report.createdAt).toLocaleString()}</p>
                                    </button>
                                    <button onClick={() => onDelete(report.id)} className="p-2 rounded-full text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <TrashIcon/>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                    {history.length > 0 && (
                        <footer className="p-4 border-t border-gray-200 dark:border-gray-700">
                            <button onClick={onClear} className="w-full py-2 px-4 rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors">Tüm Geçmişi Temizle</button>
                        </footer>
                    )}
                </div>
            </div>
        </>
    );
};

const Toast: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 8000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-start bg-blue-100 dark:bg-blue-900/80 border border-blue-400 dark:border-blue-600 text-blue-800 dark:text-blue-200 p-4 rounded-lg shadow-lg animate-fade-in-down max-w-lg w-auto">
            <InfoIcon className="h-6 w-6 mr-3 flex-shrink-0" />
            <span className="flex-grow mr-4">{message}</span>
            <button onClick={onClose} className="-mt-1 -mr-1 p-1 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 flex-shrink-0">
                <CloseIcon />
            </button>
        </div>
    );
};


// --- APP ---
export default function App() {
    const [report, setReport] = useState<Report | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
    const [history, setHistory] = useState<Report[]>([]);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [generationOptions, setGenerationOptions] = useState<GenerationOptions>({
        includeContributors: false,
        length: 'normal',
        outputFormat: 'pdf',
    });
    
    // Load history from localStorage on initial render
    useEffect(() => {
        try {
            const savedHistory = localStorage.getItem('ai_report_history');
            if (savedHistory) {
                setHistory(JSON.parse(savedHistory));
            }
        } catch (e) {
            console.error("Failed to load history from localStorage", e);
            setHistory([]);
        }
    }, []);

    // Theme effect
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove(theme === 'dark' ? 'light' : 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);
    
    const showToast = useCallback((message: string) => {
        setToastMessage(message);
    }, []);

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const handleSaveApiKey = (key: string) => {
        localStorage.setItem('user_api_key', key);
        showToast("API Anahtarı kaydedildi.");
    };

    const handleSaveReport = (newReport: Report) => {
        setHistory(prevHistory => {
            const updatedHistory = [newReport, ...prevHistory];
            localStorage.setItem('ai_report_history', JSON.stringify(updatedHistory));
            return updatedHistory;
        });
    };
    
    const handleLoadReport = (reportId: number) => {
        const reportToLoad = history.find(r => r.id === reportId);
        if(reportToLoad) {
            setReport(reportToLoad);
            setIsHistoryOpen(false);
            setError(null);
        }
    };
    
    const handleDeleteReport = (reportId: number) => {
        setHistory(prev => {
            const updated = prev.filter(r => r.id !== reportId);
            localStorage.setItem('ai_report_history', JSON.stringify(updated));
            return updated;
        });
    };

    const handleClearHistory = () => {
        if(window.confirm("Tüm rapor geçmişini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.")) {
            setHistory([]);
            localStorage.removeItem('ai_report_history');
        }
    };

    const handleGenerateReport = useCallback(async (topic: string) => {
        setIsLoading(true);
        setError(null);
        setReport(null);
        
        try {
            setLoadingMessage("İçindekiler tablosu oluşturuluyor...");
            const outline = await generateReportOutline(topic);

            if (outline.length === 0) {
                throw new Error("AI geçerli bir içindekiler tablosu oluşturamadı.");
            }
            
            const initialReport: Report = {
                id: Date.now(),
                createdAt: new Date().toISOString(),
                topic,
                sections: [],
            };
            setReport(initialReport);

            const generatedSections: ReportSection[] = [];
            const imageGenerationErrors: string[] = [];
            for (let i = 0; i < outline.length; i++) {
                const title = outline[i];
                setLoadingMessage(`'${title}' bölümü oluşturuluyor... (${i + 1}/${outline.length})`);
                const [section, imageError] = await generateFullSection(topic, title, generationOptions);
                generatedSections.push(section);

                if (imageError) {
                    imageGenerationErrors.push(imageError);
                }
                
                setReport(prev => prev ? { ...prev, sections: [...generatedSections] } : null);
            }
            
            const finalReport = { ...initialReport, sections: generatedSections };
            handleSaveReport(finalReport);
            
            if (imageGenerationErrors.length > 0) {
                const firstError = imageGenerationErrors[0];
                let displayError = firstError;

                try {
                    const errorJson = JSON.parse(firstError);
                    if (errorJson.error && errorJson.error.message) {
                        displayError = errorJson.error.message;
                    }
                } catch (e) { /* Not a JSON error, use as is. */ }
                
                let userMessage = `Görseller oluşturulamadı. Hata: ${displayError}`;
                if (displayError.toLowerCase().includes('billing')) {
                    userMessage = "Görseller oluşturulamadı: Lütfen API anahtarınızın faturalandırmasının etkin olduğundan emin olun. Yer tutucular kullanıldı."
                } else if (displayError.toLowerCase().includes('api key not valid')) {
                    userMessage = "Görseller oluşturulamadı: API anahtarınız geçersiz görünüyor. Lütfen ayarları kontrol edin."
                }
                showToast(userMessage);
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu.";
            setError(`Rapor oluşturulamadı: ${errorMessage}`);
            console.error(err);
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    }, [showToast, generationOptions]);

    const handleReset = useCallback(() => {
        setReport(null);
        setError(null);
    }, []);

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white font-sans p-4 md:p-8 transition-colors duration-300">
             <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
                 <button
                    onClick={() => setIsHistoryOpen(true)}
                    className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    aria-label="Rapor geçmişini aç"
                >
                    <HistoryIcon />
                </button>
                 <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    aria-label="Ayarları aç"
                >
                    <CogIcon />
                </button>
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    aria-label="Toggle theme"
                >
                    {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                </button>
            </div>
            
            <ApiKeyModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onSave={handleSaveApiKey} />
            <HistoryPanel isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} history={history} onLoad={handleLoadReport} onDelete={handleDeleteReport} onClear={handleClearHistory} />
            {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}

            <main className="container mx-auto">
                <header className="text-center mb-8 md:mb-12">
                    <div className="flex items-center justify-center mb-2">
                        <DocumentIcon />
                        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                            AI Rapor Oluşturucu
                        </h1>
                    </div>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        Konunuzu girin, yapay zeka sizin için derinlemesine, görselli ve düzenlenebilir raporlar hazırlasın.
                    </p>
                </header>
                
                <GenerationForm 
                    onGenerate={handleGenerateReport} 
                    isLoading={isLoading}
                    onReset={handleReset}
                    reportExists={!!report}
                    options={generationOptions}
                    setOptions={setGenerationOptions}
                />
                
                {isLoading && !report && <LoadingIndicator message={loadingMessage} />}
                
                {error && (
                    <div className="w-full max-w-2xl mx-auto bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 p-4 rounded-lg text-center">
                        <p className="font-bold">Hata!</p>
                        <p>{error}</p>
                    </div>
                )}
                
                {report && <ReportDisplay report={report} setReport={setReport} showToast={showToast} outputFormat={generationOptions.outputFormat} />}
            </main>
        </div>
    );
}