import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { Survey } from '@/shared/types';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface ExportData {
  survey: Survey;
  questions: Array<{
    id: number;
    question_text: string;
    question_type: string;
    options: string | null;
    order_index: number;
  }>;
  responses: Array<{
    interview_id: number;
    interview_date: string;
    interviewer_name: string;
    question_text: string;
    response_text: string;
    latitude: number | null;
    longitude: number | null;
  }>;
}

export async function exportToPDF(surveyId: string): Promise<void> {
  try {
    const response = await fetch(`/api/export/survey/${surveyId}/excel`);
    if (!response.ok) throw new Error('Failed to fetch export data');
    
    const data: ExportData = await response.json();
    const { survey, questions, responses } = data;

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório da Pesquisa Eleitoral', 20, 25);
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text(survey.title, 20, 35);
    
    // Survey info
    doc.setFontSize(12);
    doc.text(`Cidade: ${survey.city || 'N/A'}`, 20, 50);
    doc.text(`Bairros: ${survey.neighborhoods || 'N/A'}`, 20, 58);
    doc.text(`Amostra: ${survey.sample_size || 0} entrevistas`, 20, 66);
    doc.text(`Prazo: ${survey.deadline_date ? new Date(survey.deadline_date).toLocaleDateString('pt-BR') : 'N/A'}`, 20, 74);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 20, 82);

    let yPos = 95;

    // Statistics
    const totalInterviews = [...new Set(responses.map(r => r.interview_id))].length;
    const uniqueInterviewers = [...new Set(responses.map(r => r.interviewer_name))].length;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Estatísticas Gerais', 20, yPos);
    yPos += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Total de entrevistas: ${totalInterviews}`, 20, yPos);
    yPos += 8;
    doc.text(`Entrevistadores ativos: ${uniqueInterviewers}`, 20, yPos);
    yPos += 8;
    doc.text(`Taxa de conclusão: ${((totalInterviews / survey.sample_size) * 100).toFixed(1)}%`, 20, yPos);
    yPos += 15;

    // Questions analysis
    for (const question of questions) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.text(`${(question.order_index || 0) + 1}. ${question.question_text || 'Pergunta sem texto'}`, 20, yPos);
      yPos += 10;

      const questionResponses = responses.filter(r => r.question_text === question.question_text);
      
      if (question.question_type === 'multiple_choice') {
        const responseCounts = questionResponses.reduce((acc, r) => {
          acc[r.response_text] = (acc[r.response_text] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const tableData = Object.entries(responseCounts).map(([response, count]) => [
          response,
          count.toString(),
          `${((count / questionResponses.length) * 100).toFixed(1)}%`
        ]);

        doc.autoTable({
          head: [['Resposta', 'Quantidade', 'Percentual']],
          body: tableData,
          startY: yPos,
          margin: { left: 20 },
          styles: { fontSize: 10 },
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;
      } else {
        doc.setFont('helvetica', 'normal');
        const sampleResponses = questionResponses.slice(0, 5);
        sampleResponses.forEach(r => {
          const wrappedText = doc.splitTextToSize(r.response_text, 170);
          doc.text(`• ${wrappedText}`, 25, yPos);
          yPos += wrappedText.length * 6;
        });

        if (questionResponses.length > 5) {
          doc.text(`... e mais ${questionResponses.length - 5} respostas`, 25, yPos);
          yPos += 8;
        }
        yPos += 10;
      }
    }

    // Save PDF
    doc.save(`relatorio-${(survey.title || 'pesquisa').replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.pdf`);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    throw error;
  }
}

export async function exportToExcel(surveyId: string): Promise<void> {
  try {
    const response = await fetch(`/api/export/survey/${surveyId}/excel`);
    if (!response.ok) throw new Error('Failed to fetch export data');
    
    const data: ExportData = await response.json();
    const { survey, questions, responses } = data;

    const workbook = XLSX.utils.book_new();

    // Survey Info Sheet
    const surveyInfo = [
      ['Informações da Pesquisa'],
      ['Título', survey.title || 'N/A'],
      ['Cidade', survey.city || 'N/A'],
      ['Bairros', survey.neighborhoods || 'N/A'],
      ['Amostra', survey.sample_size || 0],
      ['Prazo', survey.deadline_date ? new Date(survey.deadline_date).toLocaleDateString('pt-BR') : 'N/A'],
      ['Gerado em', new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR')]
    ];

    const infoSheet = XLSX.utils.aoa_to_sheet(surveyInfo);
    XLSX.utils.book_append_sheet(workbook, infoSheet, 'Informações');

    // Questions Sheet
    const questionsData = [
      ['Ordem', 'Pergunta', 'Tipo', 'Opções'],
      ...questions.map(q => [
        (q.order_index || 0) + 1,
        q.question_text || 'Pergunta sem texto',
        q.question_type === 'multiple_choice' ? 'Múltipla Escolha' : 
        q.question_type === 'text' ? 'Texto Livre' : 'Avaliação',
        q.options || ''
      ])
    ];

    const questionsSheet = XLSX.utils.aoa_to_sheet(questionsData);
    XLSX.utils.book_append_sheet(workbook, questionsSheet, 'Perguntas');

    // Responses Sheet
    const responsesData = [
      ['ID Entrevista', 'Data', 'Entrevistador', 'Pergunta', 'Resposta', 'Latitude', 'Longitude'],
      ...responses.map(r => [
        r.interview_id,
        new Date(r.interview_date).toLocaleDateString('pt-BR'),
        r.interviewer_name || 'N/A',
        r.question_text || 'N/A',
        r.response_text || 'N/A',
        r.latitude || '',
        r.longitude || ''
      ])
    ];

    const responsesSheet = XLSX.utils.aoa_to_sheet(responsesData);
    XLSX.utils.book_append_sheet(workbook, responsesSheet, 'Respostas');

    // Analysis Sheet (for multiple choice questions)
    const analysisData: any[][] = [['Análise das Respostas']];
    
    questions.forEach(question => {
      if (question.question_type === 'multiple_choice') {
        const questionResponses = responses.filter(r => r.question_text === (question.question_text || ''));
        const responseCounts = questionResponses.reduce((acc, r) => {
          acc[r.response_text] = (acc[r.response_text] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        analysisData.push([]);
        analysisData.push([`${question.order_index + 1}. ${question.question_text || 'Pergunta sem texto'}`]);
        analysisData.push(['Resposta', 'Quantidade', 'Percentual']);
        
        Object.entries(responseCounts).forEach(([response, count]) => {
          analysisData.push([
            response,
            count,
            `${((count / questionResponses.length) * 100).toFixed(1)}%`
          ]);
        });
      }
    });

    const analysisSheet = XLSX.utils.aoa_to_sheet(analysisData);
    XLSX.utils.book_append_sheet(workbook, analysisSheet, 'Análise');

    // Save Excel file
    XLSX.writeFile(workbook, `relatorio-${(survey.title || 'pesquisa').replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.xlsx`);
  } catch (error) {
    console.error('Error exporting Excel:', error);
    throw error;
  }
}

export function exportResponsesCSV(responses: any[], filename: string): void {
  const csvContent = [
    ['ID Entrevista', 'Data', 'Entrevistador', 'Pergunta', 'Resposta'].join(','),
    ...responses.map(r => [
      r.interview_id,
      new Date(r.interview_date).toLocaleDateString('pt-BR'),
      r.interviewer_name || 'N/A',
      `"${(r.question_text || 'N/A').replace(/"/g, '""')}"`,
      `"${(r.response_text || 'N/A').replace(/"/g, '""')}"`
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
