export interface FutureSignal {
  id: number;
  sign: string;
  title: string;
  summary: string;
  intro: string;
  introQuote: string;
  detail: string;
  thumbnail: string;
}

export async function fetchFutureSignals(): Promise<FutureSignal[]> {
  try {
    const response = await fetch('/future-signals.csv');
    const csvText = await response.text();
    
    // 解析 CSV 文本
    const rows = parseCSV(csvText);
    const headers = rows[0];
    
    console.log('CSV Headers:', headers);
    console.log('Total rows in CSV:', rows.length - 1);
    
    const signals = rows.slice(1) // 跳过标题行
      .map((row, index) => {
        // 调试信息
        console.log(`Processing row ${index + 1}:`, row);
        
        const signal: any = {};
        headers.forEach((header, colIndex) => {
          const value = row[colIndex] || '';
          let cleanValue = value
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/\r\n|\n|\r/g, ' ')
            .trim();

          if (header.trim() === 'id') {
            const parsedId = parseInt(cleanValue);
            signal[header.trim()] = isNaN(parsedId) ? index + 1 : parsedId;
            return;
          }

          if (header.trim() === 'thumbnail') {
            const imageName = cleanValue.split('/').pop() || '';
            const validImageName = imageName.split(' ')[0];
            signal[header.trim()] = `/images/future-signals/${validImageName}`;
            return;
          }

          signal[header.trim()] = cleanValue || '';
        });
        
        return signal as FutureSignal;
      });

    console.log('Processed signals:', signals.length);
    console.log('First signal:', signals[0]);
    console.log('Last signal:', signals[signals.length - 1]);
    
    return signals;
  } catch (error) {
    console.error('Error loading future signals:', error);
    return [];
  }
}

// 解析 CSV 文本为二维数组
function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/);
  const rows: string[][] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue; // 跳过空行
    
    const row: string[] = [];
    let currentValue = '';
    let insideQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        if (insideQuotes && line[j + 1] === '"') {
          // 处理双引号转义
          currentValue += '"';
          j++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        row.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    // 添加最后一个值
    if (currentValue) {
      row.push(currentValue.trim());
    }
    
    if (row.length > 0) {
      rows.push(row);
    }
  }
  
  return rows;
} 