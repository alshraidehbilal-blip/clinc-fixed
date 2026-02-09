from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'dental-clinic-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    phone: str
    role: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: str
    role: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    password: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class Procedure(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name_en: str
    name_ar: str
    price: float
    description_en: Optional[str] = ""
    description_ar: Optional[str] = ""

class ProcedureCreate(BaseModel):
    name_en: str
    name_ar: str
    price: float
    description_en: Optional[str] = ""
    description_ar: Optional[str] = ""

class ProcedureUpdate(BaseModel):
    name_en: Optional[str] = None
    name_ar: Optional[str] = None
    price: Optional[float] = None
    description_en: Optional[str] = None
    description_ar: Optional[str] = None

class Patient(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    doctor_id: str
    doctor_name: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    total_cost: float = 0.0
    total_paid: float = 0.0
    balance: float = 0.0

class PatientCreate(BaseModel):
    name: str
    phone: str
    doctor_id: str

class Appointment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    patient_name: str = ""
    doctor_id: str
    doctor_name: str = ""
    date: str
    time: str
    status: str
    procedures: List[str] = []
    notes: Optional[str] = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AppointmentCreate(BaseModel):
    patient_id: str
    doctor_id: str
    date: str
    time: str
    status: str = "confirmed"

class AppointmentUpdate(BaseModel):
    status: Optional[str] = None
    procedures: Optional[List[str]] = None
    notes: Optional[str] = None

class PatientHistory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    doctor_id: str
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    notes: str
    xray_images: List[str] = []
    procedures: List[str] = []
    total_cost: float = 0.0

class PatientHistoryCreate(BaseModel):
    patient_id: str
    notes: str
    procedures: List[str] = []

class Payment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    patient_name: str = ""
    amount: float
    payment_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    notes: Optional[str] = ""
    recorded_by: str
    recorded_by_name: str = ""

class PaymentCreate(BaseModel):
    patient_id: str
    amount: float
    notes: Optional[str] = ""

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    if isinstance(user['created_at'], str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    return User(**user)

def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = user_data.model_dump()
    user_dict['id'] = str(uuid.uuid4())
    user_dict['created_at'] = datetime.now(timezone.utc).isoformat()
    password = user_dict.pop('password')
    user_dict['password_hash'] = get_password_hash(password)
    
    await db.users.insert_one(user_dict)
    
    access_token = create_access_token(data={"sub": user_dict['id']})
    user_obj = User(**{k: v for k, v in user_dict.items() if k != 'password_hash'})
    user_obj.created_at = datetime.fromisoformat(user_dict['created_at'])
    
    return Token(access_token=access_token, token_type="bearer", user=user_obj)

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": user['id']})
    user_obj = User(**{k: v for k, v in user.items() if k != 'password_hash'})
    if isinstance(user_obj.created_at, str):
        user_obj.created_at = datetime.fromisoformat(user_obj.created_at)
    
    return Token(access_token=access_token, token_type="bearer", user=user_obj)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@api_router.get("/users", response_model=List[User])
async def get_users(current_user: User = Depends(require_admin)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    for user in users:
        if isinstance(user.get('created_at'), str):
            user['created_at'] = datetime.fromisoformat(user['created_at'])
    return [User(**user) for user in users]

@api_router.post("/users", response_model=User)
async def create_user(user_data: UserCreate, current_user: User = Depends(require_admin)):
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = user_data.model_dump()
    user_dict['id'] = str(uuid.uuid4())
    user_dict['created_at'] = datetime.now(timezone.utc).isoformat()
    password = user_dict.pop('password')
    user_dict['password_hash'] = get_password_hash(password)
    
    await db.users.insert_one(user_dict)
    user_obj = User(**{k: v for k, v in user_dict.items() if k != 'password_hash'})
    user_obj.created_at = datetime.fromisoformat(user_dict['created_at'])
    return user_obj

@api_router.put("/users/{user_id}", response_model=User)
async def update_user(user_id: str, update_data: UserUpdate, current_user: User = Depends(require_admin)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if 'password' in update_dict:
        update_dict['password_hash'] = get_password_hash(update_dict.pop('password'))
    
    if 'email' in update_dict and update_dict['email'] != user['email']:
        existing = await db.users.find_one({"email": update_dict['email']}, {"_id": 0})
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
    
    await db.users.update_one({"id": user_id}, {"$set": update_dict})
    
    updated_user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if isinstance(updated_user.get('created_at'), str):
        updated_user['created_at'] = datetime.fromisoformat(updated_user['created_at'])
    return User(**updated_user)

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: User = Depends(require_admin)):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}

@api_router.get("/procedures", response_model=List[Procedure])
async def get_procedures(current_user: User = Depends(get_current_user)):
    procedures = await db.procedures.find({}, {"_id": 0}).to_list(1000)
    return procedures

@api_router.post("/procedures", response_model=Procedure)
async def create_procedure(procedure_data: ProcedureCreate, current_user: User = Depends(require_admin)):
    procedure_dict = procedure_data.model_dump()
    procedure_dict['id'] = str(uuid.uuid4())
    await db.procedures.insert_one(procedure_dict)
    return Procedure(**procedure_dict)

@api_router.put("/procedures/{procedure_id}", response_model=Procedure)
async def update_procedure(procedure_id: str, update_data: ProcedureUpdate, current_user: User = Depends(require_admin)):
    procedure = await db.procedures.find_one({"id": procedure_id}, {"_id": 0})
    if not procedure:
        raise HTTPException(status_code=404, detail="Procedure not found")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    await db.procedures.update_one({"id": procedure_id}, {"$set": update_dict})
    
    updated_procedure = await db.procedures.find_one({"id": procedure_id}, {"_id": 0})
    return Procedure(**updated_procedure)

@api_router.delete("/procedures/{procedure_id}")
async def delete_procedure(procedure_id: str, current_user: User = Depends(require_admin)):
    result = await db.procedures.delete_one({"id": procedure_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Procedure not found")
    return {"message": "Procedure deleted successfully"}

@api_router.get("/patients/search")
async def search_patients(name: str = Query(..., min_length=1), current_user: User = Depends(get_current_user)):
    if current_user.role == "receptionist":
        patients = await db.patients.find(
            {"name": {"$regex": name, "$options": "i"}},
            {"_id": 0, "id": 1, "name": 1, "phone": 1}
        ).to_list(10)
    else:
        patients = await db.patients.find(
            {"name": {"$regex": name, "$options": "i"}},
            {"_id": 0}
        ).to_list(10)
    return patients

@api_router.get("/patients", response_model=List[Patient])
async def get_patients(current_user: User = Depends(get_current_user)):
    query = {}
    if current_user.role == "doctor":
        query["doctor_id"] = current_user.id
    
    patients = await db.patients.find(query, {"_id": 0}).to_list(1000)
    for patient in patients:
        if isinstance(patient.get('created_at'), str):
            patient['created_at'] = datetime.fromisoformat(patient['created_at'])
    return patients

@api_router.post("/patients", response_model=Patient)
async def create_patient(patient_data: PatientCreate, current_user: User = Depends(get_current_user)):
    patient_dict = patient_data.model_dump()
    patient_dict['id'] = str(uuid.uuid4())
    patient_dict['created_at'] = datetime.now(timezone.utc).isoformat()
    patient_dict['total_cost'] = 0.0
    patient_dict['total_paid'] = 0.0
    patient_dict['balance'] = 0.0
    
    doctor = await db.users.find_one({"id": patient_dict['doctor_id']}, {"_id": 0})
    if doctor:
        patient_dict['doctor_name'] = doctor['name']
    
    await db.patients.insert_one(patient_dict)
    patient_obj = Patient(**patient_dict)
    patient_obj.created_at = datetime.fromisoformat(patient_dict['created_at'])
    return patient_obj

@api_router.get("/patients/{patient_id}", response_model=Patient)
async def get_patient(patient_id: str, current_user: User = Depends(get_current_user)):
    patient = await db.patients.find_one({"id": patient_id}, {"_id": 0})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    if current_user.role == "doctor" and patient['doctor_id'] != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if isinstance(patient.get('created_at'), str):
        patient['created_at'] = datetime.fromisoformat(patient['created_at'])
    return Patient(**patient)

@api_router.get("/appointments", response_model=List[Appointment])
async def get_appointments(current_user: User = Depends(get_current_user)):
    query = {}
    if current_user.role == "doctor":
        query["doctor_id"] = current_user.id
    
    appointments = await db.appointments.find(query, {"_id": 0}).to_list(1000)
    for appt in appointments:
        if isinstance(appt.get('created_at'), str):
            appt['created_at'] = datetime.fromisoformat(appt['created_at'])
    return appointments

@api_router.get("/appointments/check-conflict")
async def check_appointment_conflict(
    doctor_id: str = Query(...),
    date: str = Query(...),
    time: str = Query(...),
    current_user: User = Depends(get_current_user)
):
    existing = await db.appointments.find_one({
        "doctor_id": doctor_id,
        "date": date,
        "time": time,
        "status": {"$ne": "cancelled"}
    }, {"_id": 0})
    
    return {"has_conflict": existing is not None}

@api_router.post("/appointments", response_model=Appointment)
async def create_appointment(appt_data: AppointmentCreate, current_user: User = Depends(get_current_user)):
    conflict = await db.appointments.find_one({
        "doctor_id": appt_data.doctor_id,
        "date": appt_data.date,
        "time": appt_data.time,
        "status": {"$ne": "cancelled"}
    }, {"_id": 0})
    
    if conflict:
        raise HTTPException(status_code=400, detail="Time slot already booked")
    
    appt_dict = appt_data.model_dump()
    appt_dict['id'] = str(uuid.uuid4())
    appt_dict['created_at'] = datetime.now(timezone.utc).isoformat()
    appt_dict['procedures'] = []
    appt_dict['notes'] = ""
    
    patient = await db.patients.find_one({"id": appt_dict['patient_id']}, {"_id": 0})
    if patient:
        appt_dict['patient_name'] = patient['name']
    
    doctor = await db.users.find_one({"id": appt_dict['doctor_id']}, {"_id": 0})
    if doctor:
        appt_dict['doctor_name'] = doctor['name']
    
    await db.appointments.insert_one(appt_dict)
    appt_obj = Appointment(**appt_dict)
    appt_obj.created_at = datetime.fromisoformat(appt_dict['created_at'])
    return appt_obj

@api_router.put("/appointments/{appointment_id}", response_model=Appointment)
async def update_appointment(appointment_id: str, update_data: AppointmentUpdate, current_user: User = Depends(get_current_user)):
    appointment = await db.appointments.find_one({"id": appointment_id}, {"_id": 0})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if update_dict.get('procedures'):
        total_cost = 0.0
        for proc_id in update_dict['procedures']:
            proc = await db.procedures.find_one({"id": proc_id}, {"_id": 0})
            if proc:
                total_cost += proc['price']
        
        patient = await db.patients.find_one({"id": appointment['patient_id']}, {"_id": 0})
        new_total_cost = (patient.get('total_cost', 0.0) + total_cost)
        new_balance = new_total_cost - patient.get('total_paid', 0.0)
        
        await db.patients.update_one(
            {"id": appointment['patient_id']},
            {"$set": {"total_cost": new_total_cost, "balance": new_balance}}
        )
    
    await db.appointments.update_one({"id": appointment_id}, {"$set": update_dict})
    
    updated_appointment = await db.appointments.find_one({"id": appointment_id}, {"_id": 0})
    if isinstance(updated_appointment.get('created_at'), str):
        updated_appointment['created_at'] = datetime.fromisoformat(updated_appointment['created_at'])
    return Appointment(**updated_appointment)

@api_router.get("/patients/{patient_id}/history", response_model=List[PatientHistory])
async def get_patient_history(patient_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role == "receptionist":
        raise HTTPException(status_code=403, detail="Receptionists cannot access patient history")
    
    history = await db.patient_history.find({"patient_id": patient_id}, {"_id": 0}).to_list(1000)
    for record in history:
        if isinstance(record.get('date'), str):
            record['date'] = datetime.fromisoformat(record['date'])
    return history

@api_router.post("/patients/{patient_id}/history", response_model=PatientHistory)
async def add_patient_history(patient_id: str, history_data: PatientHistoryCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != "doctor" and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only doctors and admins can add patient history")
    
    history_dict = history_data.model_dump()
    history_dict['id'] = str(uuid.uuid4())
    history_dict['doctor_id'] = current_user.id
    history_dict['date'] = datetime.now(timezone.utc).isoformat()
    history_dict['xray_images'] = []
    
    total_cost = 0.0
    for proc_id in history_dict['procedures']:
        proc = await db.procedures.find_one({"id": proc_id}, {"_id": 0})
        if proc:
            total_cost += proc['price']
    history_dict['total_cost'] = total_cost
    
    patient = await db.patients.find_one({"id": patient_id}, {"_id": 0})
    new_total_cost = (patient.get('total_cost', 0.0) + total_cost)
    new_balance = new_total_cost - patient.get('total_paid', 0.0)
    
    await db.patients.update_one(
        {"id": patient_id},
        {"$set": {"total_cost": new_total_cost, "balance": new_balance}}
    )
    
    await db.patient_history.insert_one(history_dict)
    history_obj = PatientHistory(**history_dict)
    history_obj.date = datetime.fromisoformat(history_dict['date'])
    return history_obj

@api_router.post("/patients/{patient_id}/xray")
async def upload_xray(patient_id: str, file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["doctor", "admin"]:
        raise HTTPException(status_code=403, detail="Only doctors and admins can upload X-rays")
    
    contents = await file.read()
    base64_image = base64.b64encode(contents).decode('utf-8')
    image_data = f"data:{file.content_type};base64,{base64_image}"
    
    image_record = {
        "id": str(uuid.uuid4()),
        "patient_id": patient_id,
        "doctor_id": current_user.id,
        "image_data": image_data,
        "filename": file.filename,
        "uploaded_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.xray_images.insert_one(image_record)
    return {"id": image_record['id'], "filename": file.filename, "uploaded_at": image_record['uploaded_at']}

@api_router.get("/patients/{patient_id}/xrays")
async def get_patient_xrays(patient_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role == "receptionist":
        raise HTTPException(status_code=403, detail="Receptionists cannot access X-rays")
    
    xrays = await db.xray_images.find({"patient_id": patient_id}, {"_id": 0}).to_list(1000)
    return xrays

@api_router.get("/payments")
async def get_payments(current_user: User = Depends(get_current_user)):
    payments = await db.payments.find({}, {"_id": 0}).sort("payment_date", -1).to_list(1000)
    for payment in payments:
        if isinstance(payment.get('payment_date'), str):
            payment['payment_date'] = datetime.fromisoformat(payment['payment_date'])
    return payments

@api_router.get("/patients/{patient_id}/payments")
async def get_patient_payments(patient_id: str, current_user: User = Depends(get_current_user)):
    payments = await db.payments.find({"patient_id": patient_id}, {"_id": 0}).sort("payment_date", -1).to_list(1000)
    for payment in payments:
        if isinstance(payment.get('payment_date'), str):
            payment['payment_date'] = datetime.fromisoformat(payment['payment_date'])
    return payments

@api_router.post("/payments", response_model=Payment)
async def record_payment(payment_data: PaymentCreate, current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "receptionist"]:
        raise HTTPException(status_code=403, detail="Only admins and receptionists can record payments")
    
    payment_dict = payment_data.model_dump()
    payment_dict['id'] = str(uuid.uuid4())
    payment_dict['payment_date'] = datetime.now(timezone.utc).isoformat()
    payment_dict['recorded_by'] = current_user.id
    payment_dict['recorded_by_name'] = current_user.name
    
    patient = await db.patients.find_one({"id": payment_dict['patient_id']}, {"_id": 0})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    payment_dict['patient_name'] = patient['name']
    
    new_total_paid = (patient.get('total_paid', 0.0) + payment_dict['amount'])
    new_balance = patient.get('total_cost', 0.0) - new_total_paid
    
    await db.patients.update_one(
        {"id": payment_dict['patient_id']},
        {"$set": {"total_paid": new_total_paid, "balance": new_balance}}
    )
    
    await db.payments.insert_one(payment_dict)
    payment_obj = Payment(**payment_dict)
    payment_obj.payment_date = datetime.fromisoformat(payment_dict['payment_date'])
    return payment_obj

@api_router.get("/doctors", response_model=List[User])
async def get_doctors(current_user: User = Depends(get_current_user)):
    doctors = await db.users.find({"role": "doctor"}, {"_id": 0, "password_hash": 0}).to_list(1000)
    for doctor in doctors:
        if isinstance(doctor.get('created_at'), str):
            doctor['created_at'] = datetime.fromisoformat(doctor['created_at'])
    return [User(**doctor) for doctor in doctors]

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    if current_user.role == "doctor":
        appointments_today = await db.appointments.count_documents({
            "doctor_id": current_user.id,
            "date": today,
            "status": {"$in": ["confirmed", "done"]}
        })
        
        total_patients = await db.patients.count_documents({"doctor_id": current_user.id})
        
        return {
            "appointments_today": appointments_today,
            "total_patients": total_patients
        }
    elif current_user.role == "admin":
        total_patients = await db.patients.count_documents({})
        total_appointments = await db.appointments.count_documents({"date": today})
        total_doctors = await db.users.count_documents({"role": "doctor"})
        
        patients_list = await db.patients.find({}, {"_id": 0, "total_cost": 1, "total_paid": 1, "balance": 1}).to_list(10000)
        
        total_revenue = sum(p.get('total_cost', 0.0) for p in patients_list)
        total_collected = sum(p.get('total_paid', 0.0) for p in patients_list)
        total_pending = sum(p.get('balance', 0.0) for p in patients_list)
        
        return {
            "total_patients": total_patients,
            "appointments_today": total_appointments,
            "total_doctors": total_doctors,
            "total_revenue": round(total_revenue, 2),
            "total_collected": round(total_collected, 2),
            "total_pending": round(total_pending, 2)
        }
    else:
        total_patients = await db.patients.count_documents({})
        total_appointments = await db.appointments.count_documents({"date": today})
        
        return {
            "total_patients": total_patients,
            "appointments_today": total_appointments
        }

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_seed_data():
    existing_procedures = await db.procedures.count_documents({})
    if existing_procedures == 0:
        default_procedures = [
            {"id": str(uuid.uuid4()), "name_en": "Dental Cleaning", "name_ar": "تنظيف الأسنان", "price": 100.0, "description_en": "Professional teeth cleaning", "description_ar": "تنظيف احترافي للأسنان"},
            {"id": str(uuid.uuid4()), "name_en": "Tooth Filling", "name_ar": "حشو الأسنان", "price": 150.0, "description_en": "Cavity filling", "description_ar": "حشو تسوس الأسنان"},
            {"id": str(uuid.uuid4()), "name_en": "Tooth Extraction", "name_ar": "خلع الأسنان", "price": 200.0, "description_en": "Tooth removal", "description_ar": "إزالة السن"},
            {"id": str(uuid.uuid4()), "name_en": "Root Canal", "name_ar": "علاج الجذور", "price": 500.0, "description_en": "Root canal treatment", "description_ar": "علاج قناة الجذر"},
            {"id": str(uuid.uuid4()), "name_en": "Dental Crown", "name_ar": "تاج الأسنان", "price": 800.0, "description_en": "Tooth crown placement", "description_ar": "تركيب تاج الأسنان"},
            {"id": str(uuid.uuid4()), "name_en": "Teeth Whitening", "name_ar": "تبييض الأسنان", "price": 300.0, "description_en": "Professional whitening", "description_ar": "تبييض احترافي"},
            {"id": str(uuid.uuid4()), "name_en": "Dental Implant", "name_ar": "زراعة الأسنان", "price": 2000.0, "description_en": "Tooth implant surgery", "description_ar": "جراحة زراعة الأسنان"},
            {"id": str(uuid.uuid4()), "name_en": "Orthodontic Braces", "name_ar": "تقويم الأسنان", "price": 3000.0, "description_en": "Braces installation", "description_ar": "تركيب التقويم"},
            {"id": str(uuid.uuid4()), "name_en": "X-Ray", "name_ar": "أشعة سينية", "price": 50.0, "description_en": "Dental X-ray imaging", "description_ar": "تصوير الأسنان بالأشعة"},
            {"id": str(uuid.uuid4()), "name_en": "Consultation", "name_ar": "استشارة", "price": 75.0, "description_en": "Initial consultation", "description_ar": "استشارة أولية"}
        ]
        await db.procedures.insert_many(default_procedures)
        logger.info("Seeded default dental procedures")
    
    admin_count = await db.users.count_documents({"role": "admin"})
    if admin_count == 0:
        admin_user = {
            "id": str(uuid.uuid4()),
            "email": "admin@clinic.com",
            "name": "Admin",
            "phone": "+962-000-0000",
            "role": "admin",
            "password_hash": get_password_hash("admin123"),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_user)
        logger.info("Created default admin user: admin@clinic.com / admin123")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()