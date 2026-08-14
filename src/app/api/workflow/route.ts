import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET() {
  try {
    const { data: appointments, error: appErr } = await supabase
      .from('appointments')
      .select('id, appointment_date, status, patient_id, doctor_id, patients(id, users(name)), doctors(id, specialization, users(name))')
      .order('id', { ascending: false });

    if (appErr) console.warn('Appointments error:', appErr);

    const formattedAppointments = (appointments || []).map((a: any) => ({
      id: a.id,
      appointment_date: a.appointment_date,
      status: a.status,
      patient_id: a.patient_id,
      patient_name: a.patients?.users?.name || 'Patient',
      doctor_id: a.doctor_id,
      doctor_name: a.doctors?.users?.name || 'Dr. Sarah Connor',
      specialization: a.doctors?.specialization || 'Cardiology',
    }));

    const { data: records } = await supabase
      .from('medical_records')
      .select('*, patients(users(name))')
      .order('id', { ascending: false });

    const formattedRecords = (records || []).map((r: any) => ({
      ...r,
      patient_name: r.patients?.users?.name || 'Patient',
    }));

    const { data: prescriptions } = await supabase
      .from('prescriptions')
      .select('*, patients(users(name))')
      .order('id', { ascending: false });

    const formattedPrescriptions = (prescriptions || []).map((p: any) => ({
      ...p,
      patient_name: p.patients?.users?.name || 'Patient',
    }));

    const { data: labRequests } = await supabase
      .from('lab_requests')
      .select('*, patients(users(name))')
      .order('id', { ascending: false });

    const formattedLabRequests = (labRequests || []).map((l: any) => ({
      ...l,
      patient_name: l.patients?.users?.name || 'Patient',
    }));

    const { data: bills } = await supabase
      .from('bills')
      .select('*, patients(users(name))')
      .order('id', { ascending: false });

    const formattedBills = (bills || []).map((b: any) => ({
      ...b,
      patient_name: b.patients?.users?.name || 'Patient',
    }));

    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('*, users(name)')
      .order('id', { ascending: false })
      .limit(20);

    const formattedAuditLogs = (auditLogs || []).map((a: any) => ({
      ...a,
      user_name: a.users?.name || 'System',
    }));

    return NextResponse.json({
      appointments: formattedAppointments,
      records: formattedRecords,
      prescriptions: formattedPrescriptions,
      labRequests: formattedLabRequests,
      bills: formattedBills,
      auditLogs: formattedAuditLogs,
    });
  } catch (error: any) {
    console.error('WORKFLOW GET ERROR:', error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, payload, userId } = body;

    if (action === 'CREATE_APPOINTMENT') {
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          patient_id: payload.patientId || 1,
          doctor_id: payload.doctorId || 1,
          appointment_date: new Date().toISOString(),
          status: 'SCHEDULED',
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: `Created appointment #${data.id}`,
      });

      return NextResponse.json(data);
    }

    if (action === 'COMPLETE_CONSULTATION') {
      const { appointmentId, patientId, doctorId, diagnosis, notes, medicines, labTest } = payload;

      await supabase
        .from('appointments')
        .update({ status: 'COMPLETED' })
        .eq('id', appointmentId);

      const { data: recordData, error: recordError } = await supabase
        .from('medical_records')
        .insert({
          appointment_id: appointmentId,
          patient_id: patientId || 1,
          doctor_id: doctorId || 1,
          diagnosis,
          clinical_notes: notes,
        })
        .select()
        .single();

      if (recordError) throw recordError;

      if (medicines && medicines.length > 0) {
        await supabase.from('prescriptions').insert({
          medical_record_id: recordData.id,
          patient_id: patientId || 1,
          doctor_id: doctorId || 1,
          medicines,
          status: 'PENDING',
        });
      }

      if (labTest) {
        await supabase.from('lab_requests').insert({
          medical_record_id: recordData.id,
          patient_id: patientId || 1,
          doctor_id: doctorId || 1,
          test_name: labTest,
          status: 'REQUESTED',
        });
      }

      await supabase.from('bills').insert({
        patient_id: patientId || 1,
        appointment_id: appointmentId,
        consultation_amount: 500.0,
        lab_amount: 200.0,
        pharmacy_amount: 100.0,
        total_amount: 800.0,
        status: 'PENDING',
      });

      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: `Doctor completed consultation for Appointment #${appointmentId}`,
      });

      return NextResponse.json({ success: true, recordId: recordData.id });
    }

    if (action === 'DISPENSE_PRESCRIPTION') {
      await supabase
        .from('prescriptions')
        .update({ status: 'DISPENSED' })
        .eq('id', payload.prescriptionId);

      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: `Pharmacy dispensed Prescription #${payload.prescriptionId}`,
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'UPDATE_LAB_REPORT') {
      await supabase
        .from('lab_requests')
        .update({
          status: 'COMPLETED',
          report_url: payload.reportUrl || 'https://hospital.org/reports/sample.pdf',
        })
        .eq('id', payload.labRequestId);

      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: `Laboratory published Report for Lab Request #${payload.labRequestId}`,
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'PAY_BILL') {
      await supabase
        .from('bills')
        .update({ status: 'PAID' })
        .eq('id', payload.billId);

      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: `Payment confirmed for Bill #${payload.billId}`,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('WORKFLOW POST ERROR:', error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}