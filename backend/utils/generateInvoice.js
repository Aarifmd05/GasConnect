
import PDFDocument from 'pdfkit';

const formatAmount = (amount) =>
    `Rs. ${Number(amount || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;

const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });

const generateInvoice = (order, customer) => {
    const doc = new PDFDocument({
        size: 'A4',
        margins: {
            top: 45,
            bottom: 60,
            left: 50,
            right: 50
        },
        bufferPages: true
    });

    const pageWidth = doc.page.width;
    const left = 50;
    const right = pageWidth - 50;
    const contentWidth = right - left;
    const footerY = doc.page.height - 45;

    let y = 50;

    // Header
    doc.fillColor('#F59E0B')
        .fontSize(25)
        .font('Helvetica-Bold')
        .text('GasConnect', left, y);

    doc.fillColor('#374151')
        .fontSize(10)
        .font('Helvetica')
        .text('PRODUCT INVOICE', left, y + 32);

    doc.fontSize(20)
        .font('Helvetica-Bold')
        .text('INVOICE', 380, y, {
            width: 165,
            align: 'right'
        });

    y += 65;

    // Invoice details
    doc.fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#111827')
        .text('Invoice Number:', left, y);

    doc.font('Helvetica')
        .text(order.invoiceNumber || 'N/A', left + 100, y);

    doc.font('Helvetica-Bold')
        .text('Invoice Date:', 330, y);

    doc.font('Helvetica')
        .text(formatDate(order.invoiceGeneratedAt || order.createdAt), 410, y);

    y += 35;

    // Customer details
    doc.font('Helvetica-Bold')
        .fontSize(12)
        .fillColor('#F59E0B')
        .text('BILL TO', left, y);

    y += 20;

    doc.font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#111827')
        .text(customer?.name || 'Customer', left, y);

    y += 15;

    doc.font('Helvetica')
        .fillColor('#4B5563')
        .text(customer?.email || '', left, y);

    y += 15;

    doc.text(customer?.phone || '', left, y);

    y += 30;

    // Delivery address
    doc.font('Helvetica-Bold')
        .fillColor('#F59E0B')
        .fontSize(12)
        .text('DELIVERY ADDRESS', left, y);

    y += 20;

    const address = order.deliveryAddress || {};

    const addressLines = [
        address.fullAddress,
        address.landmark,
        [address.city, address.state].filter(Boolean).join(', '),
        address.pincode
    ].filter(Boolean);

    doc.font('Helvetica')
        .fontSize(10)
        .fillColor('#4B5563')
        .text(addressLines.join('\n'), left, y, {
            width: 250,
            lineGap: 3
        });

    y = doc.y + 30;

    // Product table heading
    const drawTableHeader = (continued = false) => {
        if (continued) {
            doc.font('Helvetica-Bold')
                .fontSize(12)
                .fillColor('#F59E0B')
                .text('ORDER ITEMS (CONTINUED)', left, y);

            y += 25;
        }

        doc.rect(left, y, contentWidth, 25)
            .fill('#F3F4F6');

        doc.fillColor('#111827')
            .font('Helvetica-Bold')
            .fontSize(9);

        doc.text('Product', left + 8, y + 8, { width: 230 });
        doc.text('Qty', 310, y + 8, { width: 35, align: 'center' });
        doc.text('Price', 365, y + 8, { width: 65, align: 'right' });
        doc.text('Amount', 440, y + 8, { width: 95, align: 'right' });

        y += 25;
    };

    drawTableHeader();

    // Product rows
    order.items.forEach((item) => {
        const rowHeight = 32;

        if (y + rowHeight > footerY - 15) {
            doc.addPage();
            y = 50;
            drawTableHeader(true);
        }

        doc.font('Helvetica')
            .fontSize(9)
            .fillColor('#374151');

        doc.text(item.productName || 'Product', left + 8, y + 10, {
            width: 230,
            height: 15,
            ellipsis: true
        });

        doc.text(String(item.quantity), 310, y + 10, {
            width: 35,
            align: 'center'
        });

        doc.text(formatAmount(item.price), 365, y + 10, {
            width: 65,
            align: 'right'
        });

        doc.text(formatAmount(item.subtotal), 440, y + 10, {
            width: 95,
            align: 'right'
        });

        doc.moveTo(left, y + rowHeight)
            .lineTo(right, y + rowHeight)
            .strokeColor('#E5E7EB')
            .stroke();

        y += rowHeight;
    });

    // Keep totals and payment details together
    if (y + 125 > footerY - 10) {
        doc.addPage();
        y = 55;
    }

    y += 15;

    doc.font('Helvetica-Bold')
        .fontSize(11)
        .fillColor('#111827')
        .text('Total Amount:', 340, y, {
            width: 100,
            align: 'right'
        });

    doc.fillColor('#F59E0B')
        .fontSize(14)
        .text(formatAmount(order.totalAmount), 445, y - 2, {
            width: 90,
            align: 'right'
        });

    y += 35;

    // Payment details
    doc.font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#111827')
        .text('Payment Method:', left, y);

    doc.font('Helvetica')
        .text(order.paymentMethod || 'COD', left + 105, y);

    y += 20;

    doc.font('Helvetica-Bold')
        .text('Payment Status:', left, y);

    doc.font('Helvetica')
        .text(order.paymentStatus || 'PENDING', left + 105, y);

    y += 20;

    doc.font('Helvetica-Bold')
        .text('Order Status:', left, y);

    doc.font('Helvetica')
        .text(order.orderStatus || 'PENDING', left + 105, y);

    // Footer on every page
    const pageRange = doc.bufferedPageRange();

    for (let i = 0; i < pageRange.count; i++) {
        doc.switchToPage(i);

        doc.moveTo(left, footerY - 10)
            .lineTo(right, footerY - 10)
            .strokeColor('#E5E7EB')
            .stroke();

        doc.font('Helvetica')
            .fontSize(8)
            .fillColor('#6B7280')
            .text(
                'Thank you for choosing GasConnect!',
                left,
                footerY,
                {
                    width: contentWidth,
                    align: 'center'
                }
            );

        doc.text(
            `Page ${i + 1} of ${pageRange.count}`,
            left,
            footerY + 13,
            {
                width: contentWidth,
                align: 'right'
            }
        );
    }

    return doc;
};

export default generateInvoice;
