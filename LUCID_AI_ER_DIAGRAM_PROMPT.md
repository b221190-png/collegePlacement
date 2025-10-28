# Lucid AI ER Diagram Prompt for College Placement System

Create a comprehensive Entity-Relationship (ER) diagram for a College Placement Management System with the following entities and relationships. Use proper ER diagram notation with crow's foot notation for cardinality, clear arrows showing relationship directions, and appropriate symbols for relationship types (one-to-one, one-to-many, many-to-many).

## ENTITIES AND ATTRIBUTES

### 1. User
**Primary Key:** _id (ObjectId)
**Attributes:**
- name (String, required)
- email (String, required, unique)
- password (String, required, hashed)
- role (String, enum: 'admin', 'recruiter', 'student')
- companyId (ObjectId, FK - conditional for recruiters)
- isActive (Boolean, default: true)
- lastLogin (Date)
- timestamps (createdAt, updatedAt)

### 2. Student
**Primary Key:** _id (ObjectId)
**Attributes:**
- userId (ObjectId, FK, required, unique)
- rollNumber (String, required, unique)
- branch (String, enum: CS, IT, ECE, EE, ME, CE, ChE, Biotech, Other)
- cgpa (Number, 0-10)
- phone (String, 10 digits)
- skills (Array of Strings)
- resumeUrl (String)
- resumeOriginalName (String)
- resumeFileSize (Number)
- backlogs (Number, default: 0)
- batch (Number, year)
- placed (Boolean, default: false)
- placedCompany (ObjectId, FK)
- package (String)
- timestamps (createdAt, updatedAt)

### 3. Company
**Primary Key:** _id (ObjectId)
**Attributes:**
- name (String, required)
- logoUrl (String)
- description (String, required)
- industry (String, enum: IT, Software, Consulting, Banking, Manufacturing, Healthcare, Education, E-commerce, Telecom, Automotive, Other)
- location (String, required)
- packageOffered (String, required)
- totalPositions (Number, min: 1)
- applicationDeadline (Date, required)
- status (String, enum: 'active', 'inactive', 'completed')
- requirements (Array of Strings)
- skills (Array of Strings)
- jobDescription (String)
- eligibilityCriteria (Object: minCGPA, maxBacklogs, eligibleBranches, passingYear)
- recruitmentProcess (Array of Objects)
- createdBy (ObjectId, FK, required)
- website (String, URL)
- contactEmail (String)
- contactPhone (String)
- timestamps (createdAt, updatedAt)

### 4. Application
**Primary Key:** _id (ObjectId)
**Attributes:**
- studentId (ObjectId, FK, required)
- companyId (ObjectId, FK, required)
- roundId (ObjectId, FK)
- status (String, enum: 'submitted', 'under-review', 'shortlisted', 'rejected', 'selected')
- score (Number, 0-100)
- recruiterNotes (String)
- submittedAt (Date, default: now)
- reviewedAt (Date)
- resumeUrl (String)
- formData (Object: personalInfo, academicInfo, projectDetails, experienceDetails, skills, achievements)
- isApplicationWindowOpen (Boolean)
- reviewedBy (ObjectId, FK)
- timestamps (createdAt, updatedAt)
**Unique Index:** Compound index on (studentId, companyId)

### 5. ApplicationWindow
**Primary Key:** _id (ObjectId)
**Attributes:**
- companyId (ObjectId, FK, required)
- startDate (Date, required)
- endDate (Date, required)
- startTime (String, HH:MM format)
- endTime (String, HH:MM format)
- minCGPA (Number, 0-10)
- maxBacklogs (Number, min: 0)
- eligibleBranches (Array of Strings)
- passingYear (Number)
- isActive (Boolean, default: true)
- createdBy (ObjectId, FK, required)
- description (String)
- timestamps (createdAt, updatedAt)

### 6. RecruitmentRound
**Primary Key:** _id (ObjectId)
**Attributes:**
- companyId (ObjectId, FK, required)
- name (String, required)
- description (String)
- scheduledDate (Date, required)
- status (String, enum: 'upcoming', 'ongoing', 'completed', 'cancelled')
- roundNumber (Number, min: 1)
- duration (String)
- location (String)
- isOnline (Boolean)
- meetingLink (String, URL)
- instructions (String)
- maxCandidates (Number)
- currentCandidates (Number, default: 0)
- createdBy (ObjectId, FK, required)
- timestamps (createdAt, updatedAt)

### 7. Round
**Primary Key:** _id (ObjectId)
**Attributes:**
- companyId (ObjectId, FK, required)
- name (String, required)
- type (String, enum: online_test, technical_interview, hr_interview, group_discussion, aptitude_test, case_study, coding_challenge, behavioral_interview, final_interview)
- description (String)
- sequence (Number, min: 1)
- duration (Number, in minutes)
- maxScore (Number)
- passingScore (Number)
- scheduledDate (Date)
- location (String)
- instructions (String)
- isActive (Boolean, default: true)
- requiredDocuments (Array of Strings)
- evaluationCriteria (Array of Objects: name, weight, description)
- createdBy (ObjectId, FK, required)
- timestamps (createdAt, updatedAt)

### 8. ApplicationReviewHistory
**Primary Key:** _id (ObjectId)
**Attributes:**
- applicationId (ObjectId, FK, required)
- reviewerId (ObjectId, FK, required)
- oldStatus (String, enum: same as Application status)
- newStatus (String, enum: same as Application status)
- oldScore (Number, 0-100)
- newScore (Number, 0-100)
- notes (String)
- reviewedAt (Date, default: now)
- reviewType (String, enum: 'status_change', 'score_update', 'both')
- timestamps (createdAt, updatedAt)

### 9. Notification
**Primary Key:** _id (ObjectId)
**Attributes:**
- recipientId (ObjectId, polymorphic FK)
- recipientType (String, enum: 'student', 'user')
- type (String, enum: 'application_status', 'new_company', 'deadline_reminder', 'system_update')
- message (String, required)
- read (Boolean, default: false)
- timestamp (Date, default: now)
- metadata (Mixed Object)
- timestamps (createdAt, updatedAt)

### 10. OffCampusOpportunity
**Primary Key:** _id (ObjectId)
**Attributes:**
- title (String, required)
- company (String, required)
- companyLogoUrl (String)
- type (String, enum: 'internship', 'full-time', 'freelance', 'remote', 'part-time')
- location (String, required)
- isRemote (Boolean)
- duration (String)
- stipend (String)
- salary (String)
- description (String, required)
- requirements (Array of Strings)
- skills (Array of Strings)
- applicationDeadline (Date, required)
- postedDate (Date, default: now)
- applicationLink (String, URL, required)
- industry (String, enum: same as Company)
- experience (String, enum: 'fresher', 'experienced', 'any')
- minExperience (Number)
- maxExperience (Number)
- isActive (Boolean, default: true)
- createdBy (ObjectId, FK, required)
- tags (Array of Strings)
- views (Number, default: 0)
- applications (Number, default: 0)
- timestamps (createdAt, updatedAt)

## RELATIONSHIPS (Use proper crow's foot notation with arrows)

### 1. User ←→ Student (One-to-One)
- **Direction:** User (1) ──── (1) Student
- **Foreign Key:** Student.userId references User._id
- **Constraint:** Required, Unique
- **Delete Rule:** Cascade
- **Label:** "has profile"

### 2. User ←→ Company (One-to-Many) - For Recruiters
- **Direction:** User (1) ────< (0..n) Company
- **Foreign Key:** User.companyId references Company._id (for recruiters only)
- **Constraint:** Conditional (only for role='recruiter')
- **Label:** "recruiter belongs to"

### 3. User ←→ Company (One-to-Many) - For Creation
- **Direction:** User (1) ────< (0..n) Company
- **Foreign Key:** Company.createdBy references User._id
- **Constraint:** Required
- **Label:** "created by"

### 4. Student ←→ Company (Many-to-One) - For Placement
- **Direction:** Student (0..n) >──── (0..1) Company
- **Foreign Key:** Student.placedCompany references Company._id
- **Constraint:** Optional
- **Label:** "placed at"

### 5. Student ←→ Application (One-to-Many)
- **Direction:** Student (1) ────< (0..n) Application
- **Foreign Key:** Application.studentId references Student._id
- **Constraint:** Required
- **Label:** "submits"

### 6. Company ←→ Application (One-to-Many)
- **Direction:** Company (1) ────< (0..n) Application
- **Foreign Key:** Application.companyId references Company._id
- **Constraint:** Required
- **Label:** "receives"

### 7. Company ←→ ApplicationWindow (One-to-Many)
- **Direction:** Company (1) ────< (0..n) ApplicationWindow
- **Foreign Key:** ApplicationWindow.companyId references Company._id
- **Constraint:** Required
- **Label:** "has application window"

### 8. User ←→ ApplicationWindow (One-to-Many)
- **Direction:** User (1) ────< (0..n) ApplicationWindow
- **Foreign Key:** ApplicationWindow.createdBy references User._id
- **Constraint:** Required
- **Label:** "creates window"

### 9. Company ←→ RecruitmentRound (One-to-Many)
- **Direction:** Company (1) ────< (0..n) RecruitmentRound
- **Foreign Key:** RecruitmentRound.companyId references Company._id
- **Constraint:** Required
- **Label:** "conducts rounds"

### 10. Company ←→ Round (One-to-Many)
- **Direction:** Company (1) ────< (0..n) Round
- **Foreign Key:** Round.companyId references Company._id
- **Constraint:** Required
- **Label:** "has recruitment rounds"

### 11. User ←→ RecruitmentRound (One-to-Many)
- **Direction:** User (1) ────< (0..n) RecruitmentRound
- **Foreign Key:** RecruitmentRound.createdBy references User._id
- **Constraint:** Required
- **Label:** "schedules round"

### 12. User ←→ Round (One-to-Many)
- **Direction:** User (1) ────< (0..n) Round
- **Foreign Key:** Round.createdBy references User._id
- **Constraint:** Required
- **Label:** "creates round"

### 13. Application ←→ RecruitmentRound (Many-to-One)
- **Direction:** Application (0..n) >──── (0..1) RecruitmentRound
- **Foreign Key:** Application.roundId references RecruitmentRound._id
- **Constraint:** Optional
- **Label:** "current round"

### 14. Application ←→ ApplicationReviewHistory (One-to-Many)
- **Direction:** Application (1) ────< (0..n) ApplicationReviewHistory
- **Foreign Key:** ApplicationReviewHistory.applicationId references Application._id
- **Constraint:** Required
- **Label:** "has review history"

### 15. User ←→ ApplicationReviewHistory (One-to-Many) - Reviewer
- **Direction:** User (1) ────< (0..n) ApplicationReviewHistory
- **Foreign Key:** ApplicationReviewHistory.reviewerId references User._id
- **Constraint:** Required
- **Label:** "reviews"

### 16. User ←→ Application (One-to-Many) - Reviewer
- **Direction:** User (1) ────< (0..n) Application
- **Foreign Key:** Application.reviewedBy references User._id
- **Constraint:** Optional
- **Label:** "reviewed by"

### 17. Student/User ←→ Notification (Polymorphic One-to-Many)
- **Direction:** Student/User (1) ────< (0..n) Notification
- **Foreign Key:** Notification.recipientId (polymorphic based on recipientType)
- **Constraint:** Required
- **Label:** "receives notifications"
- **Note:** Polymorphic relationship - recipientType determines if FK points to Student or User

### 18. User ←→ OffCampusOpportunity (One-to-Many)
- **Direction:** User (1) ────< (0..n) OffCampusOpportunity
- **Foreign Key:** OffCampusOpportunity.createdBy references User._id
- **Constraint:** Required
- **Label:** "posts opportunity"

## ADDITIONAL DIAGRAM REQUIREMENTS

### Design Specifications:
1. **Use Crow's Foot Notation:**
   - One: Single line ──
   - Many: Crow's foot ──<
   - Optional: Circle o
   - Mandatory: Perpendicular line |
   
2. **Arrow Direction:** Always point from the entity with the foreign key to the referenced entity

3. **Cardinality Examples:**
   - One-to-One: ──|────|──
   - One-to-Many: ──|────<──
   - Zero-to-Many: ──o────<──
   - One-to-Zero-or-One: ──|────o|──

4. **Color Coding:**
   - Core Entities (User, Student, Company, Application): Blue
   - Management Entities (ApplicationWindow, RecruitmentRound, Round): Green
   - History/Tracking (ApplicationReviewHistory, Notification): Orange
   - External (OffCampusOpportunity): Purple

5. **Layout Suggestions:**
   - Place User at the top center
   - Student and Company on the next level (left and right)
   - Application in the center below
   - Supporting entities around the core entities
   - Keep related entities close together

6. **Entity Box Format:**
   ```
   ┌─────────────────────┐
   │   Entity Name       │
   ├─────────────────────┤
   │ PK: _id (ObjectId)  │
   ├─────────────────────┤
   │ • attribute1        │
   │ • attribute2        │
   │ • FK: reference     │
   └─────────────────────┘
   ```

7. **Relationship Labels:** Include action verbs on relationship lines (e.g., "submits", "receives", "creates")

8. **Unique Constraints:** Mark unique fields with (U) and composite unique indexes with special notation

9. **Indexes:** Optionally indicate frequently queried fields with (I) for indexed

10. **Enum Values:** Show important enum values in parentheses after the attribute name

## SPECIAL NOTES

1. **User Role Hierarchy:**
   - Admin: Can manage all entities
   - Recruiter: Linked to one Company, can manage applications and rounds
   - Student: Has one Student profile, can submit applications

2. **Application Lifecycle:**
   - submitted → under-review → shortlisted → selected/rejected
   - Tracked through ApplicationReviewHistory

3. **Recruitment Process:**
   - Company has multiple RecruitmentRounds (sequenced by roundNumber)
   - Applications progress through rounds
   - Each round can have maxCandidates limit

4. **Polymorphic Relationship:**
   - Notification.recipientId can point to either Student or User
   - Determined by recipientType field

5. **Soft Delete Pattern:**
   - Many entities use isActive flag instead of deletion
   - Company.status and Round.status track lifecycle

6. **Timestamp Pattern:**
   - All entities have createdAt and updatedAt timestamps
   - Managed automatically by Mongoose

Please create a comprehensive, visually clear ER diagram with all these entities, relationships, and specifications. Ensure all arrow directions are correct, cardinalities are properly marked, and the diagram is easy to understand at a glance.
