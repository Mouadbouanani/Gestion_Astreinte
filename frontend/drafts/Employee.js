import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  name: String,
  position: String,
  department: String,
  // ... autres champs
});

const Employee = mongoose.model('Employee', employeeSchema);

export default Employee;
