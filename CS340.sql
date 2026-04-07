CREATE DATABASE  IF NOT EXISTS `cs340_project` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `cs340_project`;
-- MySQL dump 10.13  Distrib 8.0.45, for macos15 (arm64)
--
-- Host: localhost    Database: cs340_project
-- ------------------------------------------------------
-- Server version	9.6.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ 'c9c19fec-0b85-11f1-8ba7-10ef7eabdf5d:1-43';

--
-- Table structure for table `Appointment`
--

DROP TABLE IF EXISTS `Appointment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Appointment` (
  `appointment_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `clinic_id` int NOT NULL,
  `appointment_date` date NOT NULL,
  `appointment_time` time NOT NULL,
  `reason` text,
  `status` enum('Scheduled','Completed','Cancelled') NOT NULL,
  PRIMARY KEY (`appointment_id`),
  KEY `fk_appointment_user` (`user_id`),
  KEY `fk_appointment_clinic` (`clinic_id`),
  CONSTRAINT `fk_appointment_clinic` FOREIGN KEY (`clinic_id`) REFERENCES `Clinic` (`clinic_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_appointment_user` FOREIGN KEY (`user_id`) REFERENCES `User` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Appointment`
--

LOCK TABLES `Appointment` WRITE;
/*!40000 ALTER TABLE `Appointment` DISABLE KEYS */;
INSERT INTO `Appointment` VALUES (1,1,1,'2026-02-18','10:00:00','General check-up','Scheduled'),(2,2,2,'2026-02-19','11:00:00','Follow-up consultation','Scheduled'),(3,3,3,'2026-02-20','12:30:00','Lab results review','Scheduled'),(4,4,4,'2026-02-21','09:15:00','Specialist appointment','Scheduled'),(5,5,5,'2026-02-22','14:00:00','Routine screening','Scheduled'),(6,6,6,'2026-02-23','16:45:00','Thyroid consultation','Scheduled'),(7,7,7,'2026-02-24','08:30:00','Respiratory clinic visit','Scheduled'),(10,10,10,'2026-02-27','15:20:00','Nutrition counseling','Scheduled'),(11,1,1,'2026-02-26','10:00:00','Routine Checkup','Scheduled'),(12,2,2,'2026-02-27','11:30:00','Follow-up Visit','Scheduled');
/*!40000 ALTER TABLE `Appointment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `AwarenessContent`
--

DROP TABLE IF EXISTS `AwarenessContent`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `AwarenessContent` (
  `content_id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(150) NOT NULL,
  `topic` varchar(100) DEFAULT NULL,
  `content_type` enum('Article','Video','Infographic') NOT NULL,
  `content_body` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`content_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `AwarenessContent`
--

LOCK TABLES `AwarenessContent` WRITE;
/*!40000 ALTER TABLE `AwarenessContent` DISABLE KEYS */;
INSERT INTO `AwarenessContent` VALUES (1,'Understanding Diabetes','Diabetes','Article','Basics of diabetes and prevention tips.','2026-02-01 09:00:00'),(2,'Heart Health Essentials','Cardiac','Video','Short guide to healthy heart habits.','2026-02-02 09:00:00'),(3,'Cancer Screening 101','Cancer','Infographic','Screening schedules and warning signs.','2026-02-03 09:00:00'),(4,'Healthy Sleep','Lifestyle','Article','How sleep affects immune health.','2026-02-04 09:00:00'),(5,'Managing Hypertension','Cardiac','Article','Blood pressure management guide.','2026-02-05 09:00:00'),(6,'Nutrition Basics','Nutrition','Video','Balanced diet and label reading.','2026-02-06 09:00:00'),(7,'Stress and Health','Mental Health','Article','Stress impact and coping skills.','2026-02-07 09:00:00'),(8,'Understanding Asthma','Respiratory','Infographic','Triggers and inhaler use tips.','2026-02-08 09:00:00'),(9,'Exercise for Beginners','Fitness','Video','Safe workouts for starters.','2026-02-09 09:00:00'),(10,'Family Medical History','General','Article','Why tracking family history matters.','2026-02-10 09:00:00');
/*!40000 ALTER TABLE `AwarenessContent` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Clinic`
--

DROP TABLE IF EXISTS `Clinic`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Clinic` (
  `clinic_id` int NOT NULL AUTO_INCREMENT,
  `clinic_name` varchar(120) NOT NULL,
  `city` varchar(60) DEFAULT NULL,
  `address` varchar(200) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`clinic_id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Clinic`
--

LOCK TABLES `Clinic` WRITE;
/*!40000 ALTER TABLE `Clinic` DISABLE KEYS */;
INSERT INTO `Clinic` VALUES (1,'Kingdom Care Clinic','Riyadh','Olaya St, Riyadh','0111111111'),(2,'AlNahda Medical Center','Riyadh','Al Nahda, Riyadh','0112222222'),(3,'Jeddah Wellness Clinic','Jeddah','Tahlia St, Jeddah','0123333333'),(4,'Dammam Family Clinic','Dammam','King Fahd Rd, Dammam','0134444444'),(5,'Eastern Health Hub','Dammam','Corniche Rd, Dammam','0135555555'),(6,'MedCare Specialist Center','Riyadh','King Abdullah Rd, Riyadh','0116666666'),(7,'Red Sea Clinic','Jeddah','Palestine St, Jeddah','0127777777'),(8,'AlQassim Clinic','Buraidah','Center District, Buraidah','0168888888'),(9,'Najd Primary Care','Riyadh','Exit 9, Riyadh','0119999999'),(10,'Northern Care','Tabuk','Main St, Tabuk','0141010101'),(11,'Kingdom Care Clinic','Riyadh','Olaya St, Riyadh','0111111111'),(12,'AlNahda Medical Center','Riyadh','Al Nahda, Riyadh','0112222222'),(13,'Jeddah Wellness Clinic','Jeddah','Tahlia St, Jeddah','0123333333'),(14,'Dammam Family Clinic','Dammam','King Fahd Rd, Dammam','0134444444'),(15,'Eastern Health Hub','Dammam','Corniche Rd, Dammam','0135555555'),(16,'MedCare Specialist Center','Riyadh','King Abdullah Rd, Riyadh','0116666666'),(17,'Red Sea Clinic','Jeddah','Palestine St, Jeddah','0127777777'),(18,'AlQassim Clinic','Buraidah','Center District, Buraidah','0168888888'),(19,'Najd Primary Care','Riyadh','Exit 9, Riyadh','0119999999'),(20,'Northern Care','Tabuk','Main St, Tabuk','0141010101');
/*!40000 ALTER TABLE `Clinic` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `FamilyMember`
--

DROP TABLE IF EXISTS `FamilyMember`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `FamilyMember` (
  `member_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `date_of_birth` date NOT NULL,
  `relationship` varchar(50) DEFAULT NULL,
  `contact_phone` varchar(20) DEFAULT NULL,
  `medical_history` text,
  `blood_type` enum('A+','A-','B+','B-','AB+','AB-','O+','O-') DEFAULT NULL,
  `gender` enum('Male','Female') DEFAULT NULL,
  `status` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`member_id`),
  KEY `fk_family_user` (`user_id`),
  CONSTRAINT `fk_family_user` FOREIGN KEY (`user_id`) REFERENCES `User` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `FamilyMember`
--

LOCK TABLES `FamilyMember` WRITE;
/*!40000 ALTER TABLE `FamilyMember` DISABLE KEYS */;
INSERT INTO `FamilyMember` VALUES (1,1,'Fatimah','Alomran','1975-03-12','Mother','0551111111','N/A','O+','Female','Stable'),(2,1,'Fawaz','Alomran','1970-08-20','Father','0552222222','N/A','A+','Male','Stable'),(3,2,'Aisha','Albugami','2005-01-05','Sister','0553333333','Allergy notes','B+','Female','Stable'),(4,2,'Ali','Albugami','1980-11-11','Uncle','0554444444','N/A','AB+','Male','Stable'),(5,3,'Maryam','Alrakan','1999-06-30','Cousin','0555555555','N/A','O-','Female','Stable'),(6,4,'Salem','Abdulaziz','1968-02-14','Father','0556666666','N/A','A-','Male','Stable'),(7,5,'Huda','Ali','1978-09-09','Mother','0557777777','N/A','B-','Female','Stable'),(8,6,'Khalid','Saleh','2003-12-01','Brother','0558888888','N/A','O+','Male','Stable'),(9,7,'Nawal','Fahad','1985-04-17','Aunt','0559999999','N/A','A+','Female','Stable'),(11,1,'Fatimah','Alomran','1975-03-12','Mother','0551111111','N/A','O+','Female','Stable'),(12,1,'Fawaz','Alomran','1970-08-20','Father','0552222222','N/A','A+','Male','Stable'),(13,2,'Aisha','Albugami','2005-01-05','Sister','0553333333','Allergy notes','B+','Female','Stable'),(14,2,'Ali','Albugami','1980-11-11','Uncle','0554444444','N/A','AB+','Male','Stable'),(15,3,'Maryam','Alrakan','1999-06-30','Cousin','0555555555','N/A','O-','Female','Stable'),(16,4,'Salem','Abdulaziz','1968-02-14','Father','0556666666','N/A','A-','Male','Stable'),(17,5,'Huda','Ali','1978-09-09','Mother','0557777777','N/A','B-','Female','Stable'),(18,6,'Khalid','Saleh','2003-12-01','Brother','0558888888','N/A','O+','Male','Stable'),(19,7,'Nawal','Fahad','1985-04-17','Aunt','0559999999','N/A','A+','Female','Stable'),(21,10,'linda','hiltion','2004-12-21','Aunt',NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `FamilyMember` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `HealthCondition`
--

DROP TABLE IF EXISTS `HealthCondition`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `HealthCondition` (
  `condition_id` int NOT NULL AUTO_INCREMENT,
  `condition_name` varchar(120) NOT NULL,
  `category` varchar(60) DEFAULT NULL,
  `description` text,
  PRIMARY KEY (`condition_id`),
  UNIQUE KEY `condition_name` (`condition_name`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `HealthCondition`
--

LOCK TABLES `HealthCondition` WRITE;
/*!40000 ALTER TABLE `HealthCondition` DISABLE KEYS */;
INSERT INTO `HealthCondition` VALUES (1,'Type 2 Diabetes','Diabetes','Chronic condition affecting blood glucose regulation.'),(2,'Hypertension','Cardiac','High blood pressure condition.'),(3,'Coronary Artery Disease','Cardiac','Reduced blood flow in coronary arteries.'),(4,'Asthma','Respiratory','Inflammation and narrowing of airways.'),(5,'Breast Cancer','Cancer','Malignant tumor in breast tissue.'),(6,'Migraine','Neurology','Recurring headaches with neurological symptoms.'),(7,'Hypothyroidism','Endocrine','Underactive thyroid condition.'),(8,'Anemia','Hematology','Low hemoglobin or red blood cells.'),(9,'Depression','Mental Health','Mood disorder with persistent sadness.'),(10,'Obesity','Metabolic','Excess body fat with health risks.');
/*!40000 ALTER TABLE `HealthCondition` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `HealthEvent`
--

DROP TABLE IF EXISTS `HealthEvent`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `HealthEvent` (
  `event_id` int NOT NULL AUTO_INCREMENT,
  `member_id` int DEFAULT NULL,
  `condition_id` int DEFAULT NULL,
  `event_date` datetime NOT NULL,
  `severity` enum('Low','Medium','High') DEFAULT NULL,
  `symptoms` text,
  `treatment` text,
  `outcome` text,
  `event_type` varchar(50) DEFAULT NULL,
  `diagnosis` text,
  `diagnosis_date` date DEFAULT NULL,
  `notes` text,
  `onset_age` int DEFAULT NULL,
  `status` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`event_id`),
  KEY `idx_he_member` (`member_id`),
  KEY `idx_he_condition` (`condition_id`),
  CONSTRAINT `fk_he_condition` FOREIGN KEY (`condition_id`) REFERENCES `HealthCondition` (`condition_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_he_member` FOREIGN KEY (`member_id`) REFERENCES `FamilyMember` (`member_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_he_onset_age` CHECK (((`onset_age` is null) or (`onset_age` between 0 and 120)))
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `HealthEvent`
--

LOCK TABLES `HealthEvent` WRITE;
/*!40000 ALTER TABLE `HealthEvent` DISABLE KEYS */;
INSERT INTO `HealthEvent` VALUES (1,1,1,'2026-02-11 07:30:00','Medium','Fever, cough','Rest, fluids','Improved','Acute','Flu suspected','2026-02-11','Short-term viral illness',21,'Stable'),(2,2,6,'2026-02-11 12:00:00','Low','Headache','Pain relief','Resolved','Acute','Migraine','2026-02-11','Triggered by stress',20,'Stable'),(3,3,3,'2026-02-12 09:10:00','High','Chest pain','ER visit','Ongoing','Emergency','Possible angina','2026-02-12','Needs cardiology workup',55,'Unstable'),(4,4,4,'2026-02-12 18:45:00','Medium','Wheezing','Inhaler','Improved','Acute','Asthma flare','2026-02-12','Triggered by dust',18,'Stable'),(5,5,8,'2026-02-13 08:20:00','Low','Dizziness','Iron supplements','Improved','Follow-up','Mild anemia','2026-02-13','Diet advice given',25,'Stable'),(6,6,7,'2026-02-13 19:30:00','Medium','Fatigue','Medication','Ongoing','Chronic','Thyroid imbalance','2026-02-13','Monitor TSH',40,'Stable'),(7,7,1,'2026-02-14 10:00:00','Low','Thirst','Diet control','Ongoing','Check','Elevated glucose','2026-02-14','Needs lab confirmation',35,'Stable'),(8,8,2,'2026-02-14 16:10:00','Medium','High BP reading','Medication adjustment','Improved','Acute','BP elevated','2026-02-14','Home monitoring',60,'Stable'),(9,9,9,'2026-02-15 13:05:00','Medium','Low mood','Therapy','Improving','Episode','Mood symptoms','2026-02-15','Follow-up planned',22,'Stable'),(11,1,1,'2026-02-26 00:00:00','Low',NULL,NULL,NULL,NULL,NULL,NULL,NULL,25,NULL);
/*!40000 ALTER TABLE `HealthEvent` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `MedicalHistory`
--

DROP TABLE IF EXISTS `MedicalHistory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `MedicalHistory` (
  `event_id` int NOT NULL AUTO_INCREMENT,
  `member_id` int NOT NULL,
  `condition_id` int NOT NULL,
  `event_date` date NOT NULL,
  `event_type` varchar(50) DEFAULT NULL,
  `diagnosis` text,
  `severity` enum('Low','Medium','High') DEFAULT NULL,
  `symptoms` text,
  `treatment` text,
  `outcome` text,
  PRIMARY KEY (`event_id`),
  KEY `fk_history_member` (`member_id`),
  KEY `fk_history_condition` (`condition_id`),
  CONSTRAINT `fk_history_condition` FOREIGN KEY (`condition_id`) REFERENCES `HealthCondition` (`condition_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_history_member` FOREIGN KEY (`member_id`) REFERENCES `FamilyMember` (`member_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `MedicalHistory`
--

LOCK TABLES `MedicalHistory` WRITE;
/*!40000 ALTER TABLE `MedicalHistory` DISABLE KEYS */;
INSERT INTO `MedicalHistory` VALUES (1,1,2,'2021-05-10','Diagnosis','Hypertension diagnosed','Medium','Headache','Lifestyle + medication','Improved'),(2,1,1,'2022-02-20','Diagnosis','Diabetes type 2 confirmed','High','Thirst, fatigue','Diet + metformin','Ongoing'),(3,2,2,'2020-09-15','Diagnosis','Hypertension diagnosed','Low','None','Lifestyle changes','Stable'),(4,3,4,'2018-03-12','Incident','Asthma episode','Medium','Wheezing','Inhaler','Resolved'),(5,4,3,'2019-07-08','Diagnosis','CAD risk noted','High','Chest discomfort','Cardio follow-up','Ongoing'),(6,5,6,'2023-01-05','Diagnosis','Migraine diagnosed','Medium','Headache, nausea','Medication','Improved'),(7,6,7,'2020-12-02','Diagnosis','Hypothyroidism diagnosed','Medium','Fatigue','Levothyroxine','Ongoing'),(8,7,8,'2022-10-10','Diagnosis','Anemia diagnosed','Low','Dizziness','Iron supplements','Resolved'),(9,8,9,'2024-04-22','Diagnosis','Depression symptoms','Medium','Low mood','Therapy','Improving'),(10,9,10,'2021-11-30','Diagnosis','Obesity classification','Medium','N/A','Diet + exercise','Ongoing');
/*!40000 ALTER TABLE `MedicalHistory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `RiskAlert`
--

DROP TABLE IF EXISTS `RiskAlert`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `RiskAlert` (
  `alert_id` int NOT NULL AUTO_INCREMENT,
  `member_id` int NOT NULL,
  `alert_type` varchar(60) DEFAULT NULL,
  `risk_level` enum('Low','Medium','High') NOT NULL,
  `priority` varchar(20) DEFAULT NULL,
  `status` enum('New','Viewed','Resolved') NOT NULL,
  `notes` text,
  `description` text,
  `created_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved_date` datetime DEFAULT NULL,
  PRIMARY KEY (`alert_id`),
  KEY `fk_alert_member` (`member_id`),
  CONSTRAINT `fk_alert_member` FOREIGN KEY (`member_id`) REFERENCES `FamilyMember` (`member_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_alert_dates` CHECK (((`resolved_date` is null) or (`resolved_date` >= `created_date`)))
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `RiskAlert`
--

LOCK TABLES `RiskAlert` WRITE;
/*!40000 ALTER TABLE `RiskAlert` DISABLE KEYS */;
INSERT INTO `RiskAlert` VALUES (1,1,'Hereditary Diabetes','High','High','New','Family pattern suggests diabetes risk','High likelihood based on family history','2026-02-01 08:30:00',NULL),(2,1,'Cardiac Risk','Medium','Medium','Viewed','Monitor BP regularly','Hypertension history indicates cardiac risk','2026-02-02 08:30:00',NULL),(3,2,'Hypertension Monitoring','Low','Low','Resolved','Routine checks recommended','Blood pressure monitoring reminder','2026-02-03 08:30:00','2026-02-05 10:00:00'),(4,3,'Asthma Trigger Alert','Medium','High','New','Avoid known triggers','Asthma episode history suggests caution','2026-02-04 08:30:00',NULL),(5,4,'CAD Follow-up','High','High','Viewed','Schedule cardiology review','CAD indicators require follow-up','2026-02-05 08:30:00',NULL),(6,5,'Migraine Pattern','Low','Low','Resolved','Track headache frequency','Pattern suggests migraine recurrence','2026-02-06 08:30:00','2026-02-10 12:00:00'),(7,6,'Thyroid Check','Medium','Medium','New','Check TSH levels','Hypothyroidism requires monitoring','2026-02-07 08:30:00',NULL),(8,7,'Iron Level Follow-up','Low','Low','Resolved','Re-test after supplementation','Anemia history follow-up','2026-02-08 08:30:00','2026-02-09 09:00:00'),(9,8,'Mental Health Support','Medium','High','Viewed','Consider continued therapy','Symptoms indicate need for support','2026-02-09 08:30:00',NULL),(10,9,'Weight Management','Medium','Medium','New','Lifestyle plan recommended','Obesity risks detected','2026-02-10 08:30:00',NULL);
/*!40000 ALTER TABLE `RiskAlert` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `User`
--

DROP TABLE IF EXISTS `User`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `User` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `User`
--

LOCK TABLES `User` WRITE;
/*!40000 ALTER TABLE `User` DISABLE KEYS */;
INSERT INTO `User` VALUES (1,'Shoug','Alomran','shoug1@example.com','hash_001','0500000001','2026-02-01 10:00:00'),(2,'Yara','Albugami','yara2@example.com','hash_002','0500000002','2026-02-02 11:00:00'),(3,'Rose','Alrakan','rose3@example.com','hash_003','0500000003','2026-02-03 12:00:00'),(4,'Raghad','Abdulaziz','raghad4@example.com','hash_004','0500000004','2026-02-04 13:00:00'),(5,'Sara','Ali','sara5@example.com','hash_005','0500000005','2026-02-05 14:00:00'),(6,'Maha','Saleh','maha6@example.com','hash_006','0500000006','2026-02-06 15:00:00'),(7,'Noura','Fahad','noura7@example.com','hash_007','0500000007','2026-02-07 16:00:00'),(8,'Faisal','Alharbi','faisal8@example.com',NULL,'0500000008','2026-02-27 11:39:13'),(9,'Aisha','Alqahtani','aisha9@example.com',NULL,'0500000009','2026-02-27 11:43:35'),(10,'Lina','Saad','lina10@example.com','hash_010','0500000010','2026-02-10 19:00:00'),(11,'Test1','User','test1@example.com','hash','0500000011','2026-02-26 01:12:15'),(12,'Test2','User','test2@example.com','hash','0500000012','2026-02-26 01:12:15');
/*!40000 ALTER TABLE `User` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-27 11:44:46
