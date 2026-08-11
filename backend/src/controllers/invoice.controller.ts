import { Request, Response, NextFunction } from 'express';
import { generateInvoicePDF } from '../services/invoice.service';

export async function generate(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ success: false, message: 'Invalid challan ID', error: 'INVALID_ID' }); return; }

    const pdf = await generateInvoicePDF(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${id}.pdf"`);
    res.send(pdf);
  } catch (err: any) {
    if (err.message === 'CHALLAN_NOT_FOUND') {
      res.status(404).json({ success: false, message: 'Challan not found', error: 'CHALLAN_NOT_FOUND' });
      return;
    }
    if (err.message === 'ONLY_CONFIRMED_CHALLANS_CAN_BE_EXPORTED') {
      res.status(400).json({ success: false, message: 'Only confirmed challans can be exported as PDF', error: 'CHALLAN_NOT_CONFIRMED' });
      return;
    }
    next(err);
  }
}
