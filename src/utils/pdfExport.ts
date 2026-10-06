import { jsPDF } from 'jspdf';
import { ShoppingList } from '../types';
import { formatSpanishDate } from './storage';

/**
 * Genera y descarga un archivo PDF limpio y fácil de compartir por mensajería
 * con los datos y líneas de una lista de la compra.
 */
export function exportShoppingListToPdf(
  list: ShoppingList,
  creatorName?: string
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 18;
  let y = 20;

  // Cabecera verde esmeralda suave
  doc.setFillColor(5, 150, 105); // #059669
  doc.roundedRect(marginX, y, pageWidth - marginX * 2, 22, 3, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('La Compra de la Lista', marginX + 6, y + 9.5);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9.5);
  doc.text(
    'Crea y gestiona tus listas de la compra... by PabloFL',
    marginX + 6,
    y + 16.5
  );

  y += 31;

  // Nombre de la lista
  doc.setTextColor(28, 25, 23);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  const titleLines = doc.splitTextToSize(list.nombre, pageWidth - marginX * 2);
  doc.text(titleLines, marginX, y);
  y += titleLines.length * 7 + 2;

  // Metadatos (Usuario, Fecha de la compra y Total de productos)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(87, 83, 78);

  const displayUser = creatorName || list.usuarioNombre;
  if (displayUser) {
    doc.text(`Usuario: ${displayUser}`, marginX, y);
    y += 5.5;
  }

  doc.text(
    `Fecha de la compra: ${formatSpanishDate(list.fechaCompra)}`,
    marginX,
    y
  );
  y += 5.5;

  const totalUnits = list.lineas.reduce((acc, l) => acc + l.cantidad, 0);
  doc.text(
    `Productos: ${list.lineas.length} (${totalUnits} ${
      totalUnits === 1 ? 'unidad en total' : 'unidades en total'
    })`,
    marginX,
    y
  );
  y += 6;

  // Línea separadora
  doc.setDrawColor(214, 211, 209);
  doc.setLineWidth(0.4);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 7;

  // Cabecera de tabla
  doc.setFillColor(245, 245, 244);
  doc.roundedRect(marginX, y - 4.5, pageWidth - marginX * 2, 8.5, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(68, 64, 60);
  doc.text('Producto', marginX + 10, y + 1);
  doc.text('Unidades', pageWidth - marginX - 4, y + 1, { align: 'right' });
  y += 9;

  // Filas de productos
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);

  list.lineas.forEach((line, index) => {
    const productLines = doc.splitTextToSize(
      line.nombreProducto,
      pageWidth - marginX * 2 - 42
    );
    const rowHeight = Math.max(8, productLines.length * 5.5 + 2.5);

    // Salto de página si no cabe
    if (y + rowHeight > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }

    // Fondo alterno sutil
    if (index % 2 === 1) {
      doc.setFillColor(250, 250, 249);
      doc.rect(marginX, y - 4.5, pageWidth - marginX * 2, rowHeight, 'F');
    }

    // Casilla de verificación [ ]
    doc.setDrawColor(120, 113, 108);
    doc.setLineWidth(0.45);
    doc.roundedRect(marginX + 2.5, y - 3, 4.2, 4.2, 0.8, 0.8, 'S');

    if (line.marcado) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(5, 150, 105);
      doc.text('X', marginX + 3.5, y + 0.3);
    }

    // Nombre del producto
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(28, 25, 23);
    doc.text(productLines, marginX + 10, y + 0.5);

    // Cantidad / unidades
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(5, 150, 105);
    const qtyLabel = `${line.cantidad} ${
      line.cantidad === 1 ? 'ud.' : 'uds.'
    }`;
    doc.text(qtyLabel, pageWidth - marginX - 4, y + 0.5, { align: 'right' });

    // Línea inferior suave
    doc.setDrawColor(231, 229, 228);
    doc.setLineWidth(0.2);
    doc.line(
      marginX,
      y - 4.5 + rowHeight,
      pageWidth - marginX,
      y - 4.5 + rowHeight
    );

    y += rowHeight;
  });

  // Pie de página
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(168, 162, 158);
  doc.text(
    'Generado con La Compra de la Lista',
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  const safeSlug = list.nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const fileName = `lista-${safeSlug || 'compra'}-${list.fechaCompra}.pdf`;
  doc.save(fileName);
}
