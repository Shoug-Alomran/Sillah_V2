"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Calendar,
  Users,
  Pill,
  AlertTriangle,
  MapPin,
  Heart,
  Brain,
} from "lucide-react";

export default function Nav() {
  const pathname = usePathname();

  // Doctor pages
  const isDoctor =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/patients") ||
    pathname.startsWith("/appointments") ||
    pathname.startsWith("/medications") ||
    pathname.startsWith("/alerts");

  return (
    <nav className="top-nav">
      <div className="nav-left">
        <h1 className="nav-title">Sillah</h1>
      </div>

      <div className="nav-links">
        {isDoctor ? (
          <>
            <Link href="/dashboard" className="nav-link">
              <Home className="nav-icon" />
              Dashboard
            </Link>

            <Link href="/appointments" className="nav-link">
              <Calendar className="nav-icon" />
              Appointments
            </Link>

            <Link href="/patients" className="nav-link">
              <Users className="nav-icon" />
              Patients
            </Link>

            <Link href="/medications" className="nav-link">
              <Pill className="nav-icon" />
              Medications
            </Link>

            <Link href="/alerts" className="nav-link">
              <AlertTriangle className="nav-icon" />
              Alerts
            </Link>

            {/* Shared sections for both doctor + patient */}
            <Link href="/clinics" className="nav-link">
              <MapPin className="nav-icon" />
              Clinics
            </Link>

            <Link href="/awareness-hub" className="nav-link">
              <Brain className="nav-icon" />
              Awareness Hub
            </Link>
          </>
        ) : (
          <>
            <Link href="/family-tree" className="nav-link">
              <Users className="nav-icon" />
              Family Tree
            </Link>

            <Link href="/my-health" className="nav-link">
              <Heart className="nav-icon" />
              My Health
            </Link>

            <Link href="/clinics" className="nav-link">
              <MapPin className="nav-icon" />
              Clinics
            </Link>

            <Link href="/awareness-hub" className="nav-link">
              <Brain className="nav-icon" />
              Awareness Hub
            </Link>

            <Link href="/events" className="nav-link">
              <Calendar className="nav-icon" />
              Events
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}