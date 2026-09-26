import random
import sys
import os

sys.path.append(
    os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..")
    )
)

from datetime import datetime
from faker import Faker

from app.database import SessionLocal, Base, engine
from app.models import Facility, Medicine, Inventory


fake = Faker("en_IN")

random.seed(42)


# ============================================================
# STATES / DISTRICTS
# ============================================================

STATES = {
    "Karnataka": [
        "Bengaluru Urban",
        "Bengaluru Rural",
        "Mysuru",
        "Mangaluru",
        "Tumakuru",
    ],
    "Maharashtra": [
        "Mumbai",
        "Pune",
        "Nagpur",
        "Nashik",
        "Navi Mumbai",
    ],
    "Tamil Nadu": [
        "Chennai",
        "Coimbatore",
        "Madurai",
        "Salem",
        "Tiruchirappalli",
    ],
    "Telangana": [
        "Hyderabad",
        "Warangal",
        "Nizamabad",
        "Karimnagar",
    ],
}


# ============================================================
# DISTRICT COORDINATES
# ============================================================

DISTRICT_COORDINATES = {
    # Karnataka
    "Bengaluru Urban": (12.9716, 77.5946),
    "Bengaluru Rural": (13.2257, 77.5750),
    "Mysuru": (12.2958, 76.6394),
    "Mangaluru": (12.9141, 74.8560),
    "Tumakuru": (13.3392, 77.1010),

    # Maharashtra
    "Mumbai": (19.0760, 72.8777),
    "Pune": (18.5204, 73.8567),
    "Nagpur": (21.1458, 79.0882),
    "Nashik": (19.9975, 73.7898),
    "Navi Mumbai": (19.0330, 73.0297),

    # Tamil Nadu
    "Chennai": (13.0827, 80.2707),
    "Coimbatore": (11.0168, 76.9558),
    "Madurai": (9.9252, 78.1198),
    "Salem": (11.6643, 78.1460),
    "Tiruchirappalli": (10.7905, 78.7047),

    # Telangana
    "Hyderabad": (17.3850, 78.4867),
    "Warangal": (17.9689, 79.5941),
    "Nizamabad": (18.6725, 78.0941),
    "Karimnagar": (18.4386, 79.1288),
}


# ============================================================
# MEDICINE CATALOGUE
#
# name, category, dosage_form, strength, unit, priority
#
# priority:
# 1 = essential / almost universal
# 2 = common
# 3 = secondary
# 4 = hospital-level
# 5 = specialized
# ============================================================

MEDICINES = [

    # --------------------------------------------------------
    # 1. ANALGESICS / ANTIPYRETICS
    # --------------------------------------------------------

    ("Paracetamol", "Analgesic", "Tablet", "500 mg", "tablets", 1),
    ("Paracetamol 650mg Tablet", "Analgesic", "Tablet", "650 mg", "tablets", 1),
    ("Paracetamol 120mg/5mL Syrup", "Analgesic", "Syrup", "120 mg/5 mL", "bottles", 1),
    ("Ibuprofen 200mg Tablet", "Analgesic", "Tablet", "200 mg", "tablets", 2),
    ("Ibuprofen 400mg Tablet", "Analgesic", "Tablet", "400 mg", "tablets", 2),
    ("Diclofenac 50mg Tablet", "Analgesic", "Tablet", "50 mg", "tablets", 3),
    ("Diclofenac Injection", "Analgesic", "Injection", "75 mg/3 mL", "ampoules", 3),
    ("Tramadol 50mg Capsule", "Analgesic", "Capsule", "50 mg", "capsules", 4),
    ("Ketorolac Injection", "Analgesic", "Injection", "30 mg/mL", "ampoules", 4),
    ("Nimesulide 100mg Tablet", "Analgesic", "Tablet", "100 mg", "tablets", 3),

    # --------------------------------------------------------
    # 2. ANTIBIOTICS
    # --------------------------------------------------------

    ("Amoxicillin 250mg Capsule", "Antibiotic", "Capsule", "250 mg", "capsules", 2),
    ("Amoxicillin 500mg Capsule", "Antibiotic", "Capsule", "500 mg", "capsules", 1),
    ("Amoxicillin 250mg/5mL Suspension", "Antibiotic", "Suspension", "250 mg/5 mL", "bottles", 2),
    ("Azithromycin 250mg Tablet", "Antibiotic", "Tablet", "250 mg", "tablets", 2),
    ("Azithromycin 500mg Tablet", "Antibiotic", "Tablet", "500 mg", "tablets", 1),
    ("Azithromycin 200mg/5mL Suspension", "Antibiotic", "Suspension", "200 mg/5 mL", "bottles", 2),
    ("Cefixime 200mg Tablet", "Antibiotic", "Tablet", "200 mg", "tablets", 3),
    ("Cefixime 100mg/5mL Suspension", "Antibiotic", "Suspension", "100 mg/5 mL", "bottles", 3),
    ("Ceftriaxone Injection", "Antibiotic", "Injection", "1 g", "vials", 2),
    ("Cefotaxime Injection", "Antibiotic", "Injection", "1 g", "vials", 3),
    ("Doxycycline 100mg Capsule", "Antibiotic", "Capsule", "100 mg", "capsules", 3),
    ("Metronidazole 400mg Tablet", "Antibiotic", "Tablet", "400 mg", "tablets", 2),
    ("Metronidazole IV", "Antibiotic", "IV Infusion", "500 mg/100 mL", "bags", 3),
    ("Ciprofloxacin 500mg Tablet", "Antibiotic", "Tablet", "500 mg", "tablets", 3),
    ("Gentamicin Injection", "Antibiotic", "Injection", "40 mg/mL", "ampoules", 4),

    # --------------------------------------------------------
    # 3. RESPIRATORY
    # --------------------------------------------------------

    ("Salbutamol", "Respiratory", "Inhaler", "100 mcg", "units", 1),
    ("Salbutamol 2mg Tablet", "Respiratory", "Tablet", "2 mg", "tablets", 2),
    ("Salbutamol Nebulization Solution", "Respiratory", "Nebulization", "2.5 mg/2.5 mL", "respules", 1),
    ("Budesonide Nebulization Solution", "Respiratory", "Nebulization", "0.5 mg/2 mL", "respules", 2),
    ("Budesonide Inhaler", "Respiratory", "Inhaler", "200 mcg", "units", 3),
    ("Ipratropium Nebulization Solution", "Respiratory", "Nebulization", "0.5 mg/2.5 mL", "respules", 2),
    ("Montelukast 10mg Tablet", "Respiratory", "Tablet", "10 mg", "tablets", 3),
    ("Theophylline 200mg Tablet", "Respiratory", "Tablet", "200 mg", "tablets", 4),
    ("Cetirizine 10mg Tablet", "Antihistamine", "Tablet", "10 mg", "tablets", 2),
    ("Chlorpheniramine Syrup", "Antihistamine", "Syrup", "2 mg/5 mL", "bottles", 3),

    # --------------------------------------------------------
    # 4. DIABETES / ENDOCRINE
    # --------------------------------------------------------

    ("Insulin Regular", "Diabetes", "Injection", "100 IU/mL", "vials", 1),
    ("Insulin NPH", "Diabetes", "Injection", "100 IU/mL", "vials", 2),
    ("Insulin Glargine", "Diabetes", "Injection", "100 IU/mL", "pens", 4),
    ("Metformin 500mg Tablet", "Diabetes", "Tablet", "500 mg", "tablets", 1),
    ("Metformin 850mg Tablet", "Diabetes", "Tablet", "850 mg", "tablets", 2),
    ("Glibenclamide 5mg Tablet", "Diabetes", "Tablet", "5 mg", "tablets", 3),
    ("Glimepiride 1mg Tablet", "Diabetes", "Tablet", "1 mg", "tablets", 3),
    ("Glimepiride 2mg Tablet", "Diabetes", "Tablet", "2 mg", "tablets", 3),

    # --------------------------------------------------------
    # 5. CARDIOVASCULAR
    # --------------------------------------------------------

    ("Amlodipine 5mg Tablet", "Cardiovascular", "Tablet", "5 mg", "tablets", 1),
    ("Amlodipine 10mg Tablet", "Cardiovascular", "Tablet", "10 mg", "tablets", 2),
    ("Losartan 50mg Tablet", "Cardiovascular", "Tablet", "50 mg", "tablets", 2),
    ("Telmisartan 40mg Tablet", "Cardiovascular", "Tablet", "40 mg", "tablets", 2),
    ("Enalapril 5mg Tablet", "Cardiovascular", "Tablet", "5 mg", "tablets", 3),
    ("Atenolol 50mg Tablet", "Cardiovascular", "Tablet", "50 mg", "tablets", 3),
    ("Furosemide 40mg Tablet", "Cardiovascular", "Tablet", "40 mg", "tablets", 3),
    ("Furosemide Injection", "Cardiovascular", "Injection", "10 mg/mL", "ampoules", 4),
    ("Atorvastatin 10mg Tablet", "Cardiovascular", "Tablet", "10 mg", "tablets", 3),
    ("Atorvastatin 20mg Tablet", "Cardiovascular", "Tablet", "20 mg", "tablets", 3),

    # --------------------------------------------------------
    # 6. GASTROINTESTINAL
    # --------------------------------------------------------

    ("Omeprazole 20mg Capsule", "Gastrointestinal", "Capsule", "20 mg", "capsules", 1),
    ("Pantoprazole 40mg Tablet", "Gastrointestinal", "Tablet", "40 mg", "tablets", 2),
    ("Pantoprazole Injection", "Gastrointestinal", "Injection", "40 mg", "vials", 4),
    ("Ondansetron 4mg Tablet", "Gastrointestinal", "Tablet", "4 mg", "tablets", 1),
    ("Ondansetron Injection", "Gastrointestinal", "Injection", "2 mg/mL", "ampoules", 3),
    ("Domperidone 10mg Tablet", "Gastrointestinal", "Tablet", "10 mg", "tablets", 3),
    ("Loperamide 2mg Capsule", "Gastrointestinal", "Capsule", "2 mg", "capsules", 3),
    ("Lactulose Syrup", "Gastrointestinal", "Syrup", "10 g/15 mL", "bottles", 3),

    # --------------------------------------------------------
    # 7. REHYDRATION / FLUIDS
    # --------------------------------------------------------

    ("ORS", "Rehydration", "Oral Powder", "WHO Formula", "packets", 1),
    ("Normal Saline", "Emergency", "IV Infusion", "0.9%", "bottles", 1),
    ("Normal Saline 500mL", "Emergency", "IV Infusion", "0.9% 500 mL", "bottles", 1),
    ("Normal Saline 1000mL", "Emergency", "IV Infusion", "0.9% 1000 mL", "bottles", 1),
    ("Ringer Lactate 500mL", "Emergency", "IV Infusion", "500 mL", "bags", 1),
    ("Dextrose 5% 500mL", "Emergency", "IV Infusion", "5% 500 mL", "bags", 2),
    ("Dextrose 25% Injection", "Emergency", "Injection", "25%", "ampoules", 3),
    ("Dextrose 50% Injection", "Emergency", "Injection", "50%", "ampoules", 4),

    # --------------------------------------------------------
    # 8. EMERGENCY / CRITICAL CARE
    # --------------------------------------------------------

    ("Adrenaline Injection", "Emergency", "Injection", "1 mg/mL", "ampoules", 1),
    ("Atropine Injection", "Emergency", "Injection", "0.6 mg/mL", "ampoules", 3),
    ("Dopamine Injection", "Emergency", "Injection", "40 mg/mL", "ampoules", 4),
    ("Noradrenaline Injection", "Emergency", "Injection", "2 mg/2 mL", "ampoules", 4),
    ("Magnesium Sulphate Injection", "Emergency", "Injection", "50%", "ampoules", 3),
    ("Calcium Gluconate Injection", "Emergency", "Injection", "10%", "ampoules", 3),
    ("Diazepam Injection", "Emergency", "Injection", "10 mg/2 mL", "ampoules", 4),
    ("Activated Charcoal", "Emergency", "Powder", "50 g", "packs", 5),

    # --------------------------------------------------------
    # 9. OBSTETRICS / MATERNAL HEALTH
    # --------------------------------------------------------

    ("Oxytocin Injection", "Maternal Health", "Injection", "10 IU/mL", "ampoules", 2),
    ("Misoprostol 200mcg Tablet", "Maternal Health", "Tablet", "200 mcg", "tablets", 3),
    ("Tranexamic Acid Injection", "Maternal Health", "Injection", "500 mg/5 mL", "ampoules", 3),
    ("Iron Folic Acid Tablet", "Maternal Health", "Tablet", "IFA", "tablets", 1),
    ("Ferrous Sulphate Tablet", "Maternal Health", "Tablet", "200 mg", "tablets", 2),
    ("Calcium Carbonate Tablet", "Maternal Health", "Tablet", "500 mg", "tablets", 2),

    # --------------------------------------------------------
    # 10. PAEDIATRIC
    # --------------------------------------------------------

    ("Zinc 20mg Tablet", "Paediatric", "Tablet", "20 mg", "tablets", 1),
    ("Zinc Syrup", "Paediatric", "Syrup", "20 mg/5 mL", "bottles", 1),
    ("Paracetamol Paediatric Drops", "Paediatric", "Oral Drops", "100 mg/mL", "bottles", 2),
    ("Amoxicillin Paediatric Suspension", "Paediatric", "Suspension", "125 mg/5 mL", "bottles", 2),
    ("ORS Paediatric", "Paediatric", "Oral Powder", "WHO Formula", "packets", 1),
    ("Vitamin A Oral Solution", "Paediatric", "Oral Solution", "100,000 IU", "bottles", 2),

    # --------------------------------------------------------
    # 11. DERMATOLOGY / TOPICAL
    # --------------------------------------------------------

    ("Povidone Iodine Solution", "Antiseptic", "Topical Solution", "5%", "bottles", 1),
    ("Chlorhexidine Solution", "Antiseptic", "Topical Solution", "4%", "bottles", 2),
    ("Silver Sulfadiazine Cream", "Dermatology", "Cream", "1%", "tubes", 3),
    ("Clotrimazole Cream", "Dermatology", "Cream", "1%", "tubes", 3),
    ("Mupirocin Ointment", "Dermatology", "Ointment", "2%", "tubes", 4),

    # --------------------------------------------------------
    # 12. EYE / ENT
    # --------------------------------------------------------

    ("Chloramphenicol Eye Drops", "Ophthalmology", "Eye Drops", "0.5%", "bottles", 3),
    ("Moxifloxacin Eye Drops", "Ophthalmology", "Eye Drops", "0.5%", "bottles", 4),
    ("Timolol Eye Drops", "Ophthalmology", "Eye Drops", "0.5%", "bottles", 5),
    ("Xylometazoline Nasal Drops", "ENT", "Nasal Drops", "0.1%", "bottles", 3),

    # --------------------------------------------------------
    # 13. MENTAL HEALTH / NEUROLOGY
    # --------------------------------------------------------

    ("Phenytoin 100mg Tablet", "Neurology", "Tablet", "100 mg", "tablets", 4),
    ("Sodium Valproate 200mg Tablet", "Neurology", "Tablet", "200 mg", "tablets", 4),
    ("Levetiracetam 500mg Tablet", "Neurology", "Tablet", "500 mg", "tablets", 5),
    ("Amitriptyline 10mg Tablet", "Neurology", "Tablet", "10 mg", "tablets", 4),

    # --------------------------------------------------------
    # 14. OTHER ESSENTIALS
    # --------------------------------------------------------

    ("Multivitamin Tablet", "Nutrition", "Tablet", "Multivitamin", "tablets", 2),
    ("Vitamin B Complex Tablet", "Nutrition", "Tablet", "B Complex", "tablets", 2),
    ("Calcium Tablet", "Nutrition", "Tablet", "500 mg", "tablets", 2),
    ("Folic Acid 5mg Tablet", "Nutrition", "Tablet", "5 mg", "tablets", 2),
]


# ============================================================
# FACILITIES
# ============================================================

def create_facilities(db, count=100):

    facilities = []

    states = list(STATES.keys())

    for i in range(1, count + 1):

        state = random.choice(states)

        district = random.choice(
            STATES[state]
        )

        facility_type = random.choices(
            [
                "PHC",
                "CHC",
                "District Hospital",
            ],
            weights=[70, 20, 10],
        )[0]

        if facility_type == "PHC":

            total_beds = random.randint(10, 30)
            doctors = random.randint(1, 4)
            nurses = random.randint(3, 8)

        elif facility_type == "CHC":

            total_beds = random.randint(30, 80)
            doctors = random.randint(4, 10)
            nurses = random.randint(8, 20)

        else:

            total_beds = random.randint(100, 300)
            doctors = random.randint(15, 50)
            nurses = random.randint(30, 100)

        occupied = random.randint(
            int(total_beds * 0.35),
            int(total_beds * 0.95),
        )

        doctors_available = random.randint(
            max(1, int(doctors * 0.6)),
            doctors,
        )

        nurses_available = random.randint(
            max(1, int(nurses * 0.6)),
            nurses,
        )

        base_latitude, base_longitude = DISTRICT_COORDINATES[
            district
        ]

        facility = Facility(
            facility_code=f"FAC-{i:04d}",

            name=f"{district} {facility_type} {i}",

            facility_type=facility_type,

            state=state,

            district=district,

            latitude=base_latitude + random.uniform(-0.08, 0.08),

            longitude=base_longitude + random.uniform(-0.08, 0.08),

            total_beds=total_beds,

            occupied_beds=occupied,

            doctors_total=doctors,

            doctors_available=doctors_available,

            nurses_total=nurses,

            nurses_available=nurses_available,
        )

        db.add(facility)

        facilities.append(facility)

    db.commit()

    return facilities


# ============================================================
# MEDICINES
# ============================================================

def create_medicines(db):

    medicines = []

    for (
        name,
        category,
        dosage_form,
        strength,
        unit,
        priority,
    ) in MEDICINES:

        medicine = Medicine(
            name=name,
            category=category,
            dosage_form=dosage_form,
            strength=strength,
            unit=unit,
        )

        db.add(medicine)

        medicines.append(
            {
                "object": medicine,
                "priority": priority,
                "category": category,
            }
        )

    db.commit()

    return medicines


# ============================================================
# FACILITY MEDICINE AVAILABILITY
# ============================================================

def medicine_available_at_facility(
    facility_type,
    priority,
    category,
):
    """
    Determines whether a medicine SKU should exist
    in the inventory catalogue of a facility.

    PHC:
        mostly essential medicines

    CHC:
        broader catalogue

    District Hospital:
        almost complete catalogue
    """

    if facility_type == "PHC":

        if priority == 1:
            return True

        if priority == 2:
            return random.random() < 0.90

        if priority == 3:
            return random.random() < 0.55

        if priority == 4:
            return random.random() < 0.15

        return random.random() < 0.05

    if facility_type == "CHC":

        if priority <= 2:
            return True

        if priority == 3:
            return random.random() < 0.90

        if priority == 4:
            return random.random() < 0.65

        return random.random() < 0.20

    # District Hospital

    if priority <= 4:
        return True

    return random.random() < 0.85


# ============================================================
# BASE DAILY CONSUMPTION
# ============================================================

def get_base_consumption(
    facility_type,
    category,
):
    """
    Creates realistic relative consumption levels.

    Larger facilities consume more.
    Common categories have higher demand.
    """

    if facility_type == "PHC":
        multiplier = 1.0

    elif facility_type == "CHC":
        multiplier = 2.5

    else:
        multiplier = 6.0

    category_multiplier = {

        "Analgesic": 1.25,

        "Antibiotic": 1.10,

        "Respiratory": 1.00,

        "Diabetes": 0.80,

        "Cardiovascular": 0.75,

        "Gastrointestinal": 0.90,

        "Rehydration": 1.20,

        "Emergency": 0.65,

        "Maternal Health": 0.70,

        "Paediatric": 0.85,

        "Antiseptic": 0.65,

        "Dermatology": 0.45,

        "Ophthalmology": 0.35,

        "ENT": 0.40,

        "Neurology": 0.30,

        "Nutrition": 0.55,
    }

    category_factor = category_multiplier.get(
        category,
        0.60,
    )

    base = random.uniform(8, 30)

    return max(
        1,
        int(base * multiplier * category_factor),
    )


# ============================================================
# INVENTORY
# ============================================================

def create_inventory(
    db,
    facilities,
    medicines,
):

    inventory_count = 0

    for facility in facilities:

        for medicine_data in medicines:

            medicine = medicine_data["object"]

            priority = medicine_data["priority"]

            category = medicine_data["category"]

            # ------------------------------------------------
            # Not every facility stocks every SKU
            # ------------------------------------------------

            if not medicine_available_at_facility(
                facility.facility_type,
                priority,
                category,
            ):
                continue

            # ------------------------------------------------
            # Daily consumption
            # ------------------------------------------------

            daily_consumption = get_base_consumption(
                facility.facility_type,
                category,
            )

            # Small randomness
            daily_consumption = round(
                daily_consumption
                * random.uniform(0.75, 1.25),
                2,
            )

            # ------------------------------------------------
            # Stock coverage
            # ------------------------------------------------

            if priority == 1:

                coverage_days = random.uniform(
                    8,
                    20,
                )

            elif priority == 2:

                coverage_days = random.uniform(
                    7,
                    18,
                )

            elif priority == 3:

                coverage_days = random.uniform(
                    6,
                    16,
                )

            else:

                coverage_days = random.uniform(
                    4,
                    14,
                )

            current_stock = max(
                1,
                int(
                    daily_consumption
                    * coverage_days
                ),
            )

            # ------------------------------------------------
            # Safety stock
            # ------------------------------------------------

            safety_days = random.uniform(
                3,
                7,
            )

            safety_stock = max(
                1,
                int(
                    daily_consumption
                    * safety_days
                ),
            )

            # ------------------------------------------------
            # Lead time
            # ------------------------------------------------

            if facility.facility_type == "PHC":

                lead_time = random.randint(
                    2,
                    7,
                )

            elif facility.facility_type == "CHC":

                lead_time = random.randint(
                    2,
                    9,
                )

            else:

                lead_time = random.randint(
                    2,
                    12,
                )

            # ------------------------------------------------
            # Incoming stock
            # ------------------------------------------------

            incoming_quantity = 0

            incoming_probability = random.random()

            if incoming_probability < 0.25:

                incoming_quantity = max(
                    1,
                    int(
                        daily_consumption
                        * random.uniform(
                            5,
                            20,
                        )
                    ),
                )

            # ------------------------------------------------
            # Create inventory
            # ------------------------------------------------

            inventory = Inventory(

                facility_id=facility.id,

                medicine_id=medicine.id,

                current_stock=current_stock,

                daily_consumption=daily_consumption,

                safety_stock=safety_stock,

                incoming_quantity=incoming_quantity,

                lead_time_days=lead_time,

                last_updated=datetime.utcnow(),
            )

            db.add(inventory)

            inventory_count += 1

    db.commit()

    return inventory_count


# ============================================================
# MAIN
# ============================================================

def main():

    print(
        "Starting ResiliCare data generation..."
    )

    Base.metadata.create_all(
        bind=engine
    )

    db = SessionLocal()

    try:

        # ----------------------------------------------------
        # MEDICINES
        # ----------------------------------------------------

        print(
            "Creating medicines..."
        )

        medicines = create_medicines(
            db
        )

        # ----------------------------------------------------
        # FACILITIES
        # ----------------------------------------------------

        print(
            "Creating facilities..."
        )

        facilities = create_facilities(
            db,
            count=100,
        )

        # ----------------------------------------------------
        # INVENTORY
        # ----------------------------------------------------

        print(
            "Creating inventory..."
        )

        inventory_count = create_inventory(
            db,
            facilities,
            medicines,
        )

        # ----------------------------------------------------
        # SUMMARY
        # ----------------------------------------------------

        print()

        print(
            "================================"
        )

        print(
            "ResiliCare data generation done"
        )

        print(
            "================================"
        )

        print(
            f"Facilities created: "
            f"{len(facilities)}"
        )

        print(
            f"Medicines created: "
            f"{len(medicines)}"
        )

        print(
            f"Inventory records: "
            f"{inventory_count}"
        )

        print(
            "================================"
        )

    finally:

        db.close()


if __name__ == "__main__":
    main()