
"use client";

import { useEffect, useState, type ReactNode } from 'react';
import { MessageSquare, BookOpen, Scale, FileText, Users, Shield, Home, Car, Briefcase, Heart, GraduationCap, Building } from 'lucide-react';
import { SignInButton, SignUpButton, useAuth } from '@clerk/nextjs';
import ChatInterface from '@/components/ChatInterface';
import LanguageToggle from '@/components/LanguageToggle';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:8000`
    : 'http://127.0.0.1:8000');

type Language = 'en' | 'ta';

interface LegalCategory {
  id: number;
  icon: ReactNode;
  titleEn: string;
  titleTa: string;
  descriptionEn: string;
  descriptionTa: string;
  overviewEn: string;
  overviewTa: string;
  learnEn: string[];
  learnTa: string[];
  referencesEn: string[];
  referencesTa: string[];
}

interface BackendCategoryStudy {
  id: number;
  title_en: string;
  title_ta: string;
  description_en: string;
  description_ta: string;
  overview: string;
  learn_points: string[];
  references: string[];
  source_count: number;
  source_type: string;
}

function isPdfLikeReference(value: string) {
  return /(^|[\\/])[^\\/\s]+\.pdf($|[?#\s])/i.test((value || '').trim());
}

function isBrokenLocalizedText(value: string) {
  const text = (value || '').trim();
  return (
    !text ||
    text.includes('à') ||
    text.includes('Ã') ||
    /\?{3,}/.test(text)
  );
}

function getLocalizedText(language: Language, english: string, tamil: string) {
  if (language === 'en') {
    return english;
  }
  return isBrokenLocalizedText(tamil) ? english : tamil;
}

function getLocalizedList(language: Language, english: string[], tamil: string[]) {
  if (language === 'en') {
    return english;
  }
  if (!tamil.length || tamil.some((item) => isBrokenLocalizedText(item))) {
    return english;
  }
  return tamil;
}

// Tamil Nadu legal categories with study-focused details
const legalCategories: LegalCategory[] = [
  {
    id: 1,
    icon: <Home className="w-6 h-6" />,
    titleEn: "Property & Land Laws",
    titleTa: "\u0b9a\u0bca\u0ba4\u0bcd\u0ba4\u0bc1 & \u0ba8\u0bbf\u0bb2\u0b9a\u0bcd \u0b9a\u0b9f\u0bcd\u0b9f\u0b99\u0bcd\u0b95\u0bb3\u0bcd",
    descriptionEn: "Land disputes, property registration, tenant rights",
    descriptionTa: "\u0ba8\u0bbf\u0bb2 \u0bb5\u0bbf\u0bb5\u0b95\u0bbe\u0bb0\u0b99\u0bcd\u0b95\u0bb3\u0bcd, \u0b9a\u0bca\u0ba4\u0bcd\u0ba4\u0bc1 \u0baa\u0ba4\u0bbf\u0bb5\u0bc1, \u0b95\u0bc1\u0b9f\u0bbf\u0baf\u0bbf\u0bb0\u0bc1\u0baa\u0bcd\u0baa\u0bbe\u0bb3\u0bb0\u0bcd \u0b89\u0bb0\u0bbf\u0bae\u0bc8\u0b95\u0bb3\u0bcd",
    overviewEn: "This section helps you understand land ownership documents, property transfer steps, and tenant-landlord rights commonly used in Tamil Nadu.",
    overviewTa: "à®‡à®¨à¯à®¤ à®ªà®•à¯à®¤à®¿ à®¤à®®à®¿à®´à¯à®¨à®¾à®Ÿà¯à®Ÿà®¿à®²à¯ à®ªà¯Šà®¤à¯à®µà®¾à®• à®ªà®¯à®©à¯à®ªà®Ÿà¯à®¤à¯à®¤à®ªà¯à®ªà®Ÿà¯à®®à¯ à®¨à®¿à®² à®‰à®°à®¿à®®à¯ˆ à®†à®µà®£à®™à¯à®•à®³à¯, à®šà¯Šà®¤à¯à®¤à¯ à®®à®¾à®±à¯à®± à®¨à®Ÿà¯ˆà®®à¯à®±à¯ˆà®•à®³à¯, à®µà¯€à®Ÿà¯à®Ÿà¯à®µà®¾à®Ÿà®•à¯ˆà®¯à®¾à®³à®°à¯ à®‰à®°à®¿à®®à¯ˆà®•à®³à¯ à®†à®•à®¿à®¯à®µà®±à¯à®±à¯ˆ à®µà®¿à®³à®•à¯à®•à¯à®•à®¿à®±à®¤à¯.",
    learnEn: [
      "Land records: Patta, Chitta, Adangal, Field Measurement Book",
      "Property registration workflow and stamp duty basics",
      "Tenant protections and eviction-related legal principles",
    ],
    learnTa: [
      "à®¨à®¿à®² à®†à®µà®£à®™à¯à®•à®³à¯: à®ªà®Ÿà¯à®Ÿà®¾, à®šà®¿à®Ÿà¯à®Ÿà®¾, à®…à®Ÿà®™à¯à®•à®²à¯, FMB",
      "à®šà¯Šà®¤à¯à®¤à¯ à®ªà®¤à®¿à®µà¯ à®¨à®Ÿà¯ˆà®®à¯à®±à¯ˆ à®®à®±à¯à®±à¯à®®à¯ à®®à¯à®¤à¯à®¤à®¿à®°à¯ˆ à®•à®Ÿà¯à®Ÿà®£ à®…à®Ÿà®¿à®ªà¯à®ªà®Ÿà¯ˆ",
      "à®µà®¾à®Ÿà®•à¯ˆà®¯à®¾à®³à®°à¯ à®ªà®¾à®¤à¯à®•à®¾à®ªà¯à®ªà¯ à®®à®±à¯à®±à¯à®®à¯ à®µà¯†à®³à®¿à®¯à¯‡à®±à¯à®±à®®à¯ à®¤à¯Šà®Ÿà®°à¯à®ªà®¾à®© à®šà®Ÿà¯à®Ÿà®•à¯ à®•à®°à¯à®¤à¯à®¤à¯à®•à¯à®•à®³à¯",
    ],
    referencesEn: [
      "Registration Act procedures (state implementation)",
      "Tamil Nadu land revenue record process",
      "Tenant protection principles used in TN courts",
    ],
    referencesTa: [
      "à®ªà®¤à®¿à®µà¯ à®šà®Ÿà¯à®Ÿ à®¨à®Ÿà¯ˆà®®à¯à®±à¯ˆà®•à®³à¯ (à®®à®¾à®¨à®¿à®² à®…à®®à®²à®¾à®•à¯à®•à®®à¯)",
      "à®¤à®®à®¿à®´à¯à®¨à®¾à®Ÿà¯ à®¨à®¿à®² à®µà®°à¯à®µà®¾à®¯à¯ à®ªà®¤à®¿à®µà¯à®•à®³à¯ à®¤à¯Šà®Ÿà®°à¯à®ªà®¾à®© à®¨à®Ÿà¯ˆà®®à¯à®±à¯ˆ",
      "à®¤à®®à®¿à®´à¯à®¨à®¾à®Ÿà¯ à®¨à¯€à®¤à®¿à®®à®©à¯à®±à®™à¯à®•à®³à®¿à®²à¯ à®ªà®¯à®©à¯à®ªà®Ÿà¯à®®à¯ à®µà®¾à®Ÿà®•à¯ˆà®¯à®¾à®³à®°à¯ à®ªà®¾à®¤à¯à®•à®¾à®ªà¯à®ªà¯ à®•à¯‹à®Ÿà¯à®ªà®¾à®Ÿà¯à®•à®³à¯",
    ],
  },
  {
    id: 2,
    icon: <Car className="w-6 h-6" />,
    titleEn: "Accident & Motor Vehicle",
    titleTa: "\u0bb5\u0bbf\u0baa\u0ba4\u0bcd\u0ba4\u0bc1 & \u0bae\u0bcb\u0b9f\u0bcd\u0b9f\u0bbe\u0bb0\u0bcd \u0bb5\u0bbe\u0b95\u0ba9\u0bae\u0bcd",
    descriptionEn: "Road accidents, insurance claims, traffic violations",
    descriptionTa: "\u0b9a\u0bbe\u0bb2\u0bc8 \u0bb5\u0bbf\u0baa\u0ba4\u0bcd\u0ba4\u0bc1\u0b95\u0bb3\u0bcd, \u0b95\u0bbe\u0baa\u0bcd\u0baa\u0bc0\u0b9f\u0bcd\u0b9f\u0bc1 \u0b95\u0bcb\u0bb0\u0bbf\u0b95\u0bcd\u0b95\u0bc8\u0b95\u0bb3\u0bcd, \u0baa\u0bcb\u0b95\u0bcd\u0b95\u0bc1\u0bb5\u0bb0\u0ba4\u0bcd\u0ba4\u0bc1 \u0bae\u0bc0\u0bb1\u0bb2\u0bcd\u0b95\u0bb3\u0bcd",
    overviewEn: "Focus on immediate legal steps after road accidents, compensation claims, and interaction with police and insurance companies.",
    overviewTa: "à®šà®¾à®²à¯ˆ à®µà®¿à®ªà®¤à¯à®¤à¯à®•à¯à®•à¯à®ªà¯ à®ªà®¿à®±à®•à¯ à®‰à®Ÿà®©à®Ÿà®¿ à®šà®Ÿà¯à®Ÿ à®¨à®Ÿà®µà®Ÿà®¿à®•à¯à®•à¯ˆà®•à®³à¯, à®‡à®´à®ªà¯à®ªà¯€à®Ÿà¯ à®•à¯‹à®°à®¿à®•à¯à®•à¯ˆ, à®ªà¯‹à®²à¯€à®¸à¯ à®®à®±à¯à®±à¯à®®à¯ à®•à®¾à®ªà¯à®ªà¯€à®Ÿà¯à®Ÿà¯ à®¨à®¿à®±à¯à®µà®©à®™à¯à®•à®³à¯à®Ÿà®©à¯ à®šà¯†à®¯à®²à¯à®ªà®Ÿà¯à®®à¯ à®µà®¿à®¤à®®à¯ à®†à®•à®¿à®¯à®µà®±à¯à®±à®¿à®²à¯ à®‡à®¨à¯à®¤ à®ªà®•à¯à®¤à®¿ à®•à®µà®©à®®à¯ à®šà¯†à®²à¯à®¤à¯à®¤à¯à®•à®¿à®±à®¤à¯.",
    learnEn: [
      "How FIR, accident report, and medical records support a claim",
      "Motor Accident Claims Tribunal process",
      "Insurance timelines, documentation, and common rejection reasons",
    ],
    learnTa: [
      "FIR, à®µà®¿à®ªà®¤à¯à®¤à¯ à®…à®±à®¿à®•à¯à®•à¯ˆ, à®®à®°à¯à®¤à¯à®¤à¯à®µ à®†à®µà®£à®™à¯à®•à®³à¯ à®•à¯‹à®°à®¿à®•à¯à®•à¯ˆà®¯à®¿à®²à¯ à®Žà®ªà¯à®ªà®Ÿà®¿ à®‰à®¤à®µà¯à®•à®¿à®©à¯à®±à®©",
      "à®®à¯‹à®Ÿà¯à®Ÿà®¾à®°à¯ à®µà®¿à®ªà®¤à¯à®¤à¯ à®•à¯‹à®°à®¿à®•à¯à®•à¯ˆ à®¤à¯€à®°à¯à®ªà¯à®ªà®¾à®¯ à®¨à®Ÿà¯ˆà®®à¯à®±à¯ˆ",
      "à®•à®¾à®ªà¯à®ªà¯€à®Ÿà¯à®Ÿà¯ à®•à®¾à®²à®µà®°à®®à¯à®ªà¯, à®†à®µà®£à®™à¯à®•à®³à¯, à®¨à®¿à®°à®¾à®•à®°à®¿à®ªà¯à®ªà®¿à®©à¯ à®ªà¯Šà®¤à¯à®µà®¾à®© à®•à®¾à®°à®£à®™à¯à®•à®³à¯",
    ],
    referencesEn: [
      "Motor Vehicles Act claim framework",
      "MACT filing flow and evidence checklist",
      "Traffic violation and penalty principles",
    ],
    referencesTa: [
      "à®®à¯‹à®Ÿà¯à®Ÿà®¾à®°à¯ à®µà®¾à®•à®© à®šà®Ÿà¯à®Ÿà®¤à¯à®¤à®¿à®©à¯ à®•à¯‹à®°à®¿à®•à¯à®•à¯ˆ à®…à®®à¯ˆà®ªà¯à®ªà¯",
      "MACT à®®à®©à¯à®¤à¯ à®¤à®¾à®•à¯à®•à®²à¯ à®¨à®Ÿà¯ˆà®®à¯à®±à¯ˆ à®®à®±à¯à®±à¯à®®à¯ à®šà®¾à®©à¯à®±à¯à®•à®³à¯ à®ªà®Ÿà¯à®Ÿà®¿à®¯à®²à¯",
      "à®ªà¯‹à®•à¯à®•à¯à®µà®°à®¤à¯à®¤à¯ à®®à¯€à®±à®²à¯ à®®à®±à¯à®±à¯à®®à¯ à®…à®ªà®°à®¾à®¤ à®…à®Ÿà®¿à®ªà¯à®ªà®Ÿà¯ˆ à®µà®¿à®¤à®¿à®•à®³à¯",
    ],
  },
  {
    id: 3,
    icon: <Briefcase className="w-6 h-6" />,
    titleEn: "Employment & Labor",
    titleTa: "\u0bb5\u0bc7\u0bb2\u0bc8\u0bb5\u0bbe\u0baf\u0bcd\u0baa\u0bcd\u0baa\u0bc1 & \u0ba4\u0bca\u0bb4\u0bbf\u0bb2\u0bbe\u0bb3\u0bb0\u0bcd",
    descriptionEn: "Workplace rights, wages, termination disputes",
    descriptionTa: "\u0baa\u0ba3\u0bbf\u0baf\u0bbf\u0b9f \u0b89\u0bb0\u0bbf\u0bae\u0bc8\u0b95\u0bb3\u0bcd, \u0b8a\u0ba4\u0bbf\u0baf\u0b99\u0bcd\u0b95\u0bb3\u0bcd, \u0baa\u0ba3\u0bbf\u0ba8\u0bc0\u0b95\u0bcd\u0b95\u0bae\u0bcd \u0bb5\u0bbf\u0bb5\u0b95\u0bbe\u0bb0\u0b99\u0bcd\u0b95\u0bb3\u0bcd",
    overviewEn: "Covers wage rights, termination disputes, workplace harassment safeguards, and formal complaint routes for workers and employees.",
    overviewTa: "à®Šà®¤à®¿à®¯ à®‰à®°à®¿à®®à¯ˆà®•à®³à¯, à®ªà®£à®¿à®¨à¯€à®•à¯à®•à®®à¯ à®¤à¯Šà®Ÿà®°à¯à®ªà®¾à®© à®ªà®¿à®°à®šà¯à®šà®¿à®©à¯ˆà®•à®³à¯, à®ªà®£à®¿à®¯à®¿à®Ÿ à®¤à¯à®©à¯à®ªà¯à®±à¯à®¤à¯à®¤à®²à¯ à®ªà®¾à®¤à¯à®•à®¾à®ªà¯à®ªà¯ à®®à®±à¯à®±à¯à®®à¯ à®‰à®¤à¯à®¤à®¿à®¯à¯‹à®•à®ªà¯à®ªà¯‚à®°à¯à®µ à®ªà¯à®•à®¾à®°à¯ à®¨à®Ÿà¯ˆà®®à¯à®±à¯ˆà®•à®³à¯ à®†à®•à®¿à®¯à®µà®±à¯à®±à¯ˆ à®‡à®¨à¯à®¤ à®ªà®•à¯à®¤à®¿ à®µà®¿à®³à®•à¯à®•à¯à®•à®¿à®±à®¤à¯.",
    learnEn: [
      "Minimum wages, overtime, and salary deduction rules",
      "Domestic inquiry and principles of fair termination",
      "How to approach labor office, conciliation, and labor courts",
    ],
    learnTa: [
      "à®•à¯à®±à¯ˆà®¨à¯à®¤à®ªà®Ÿà¯à®š à®Šà®¤à®¿à®¯à®®à¯, à®“à®µà®°à¯ à®Ÿà¯ˆà®®à¯, à®šà®®à¯à®ªà®³à®•à¯ à®•à®´à®¿à®µà¯ à®µà®¿à®¤à®¿à®•à®³à¯",
      "à®‰à®³à¯à®•à®Ÿà¯à®Ÿà®³à¯ˆ à®µà®¿à®šà®¾à®°à®£à¯ˆ à®®à®±à¯à®±à¯à®®à¯ à®¨à®¿à®¯à®¾à®¯à®®à®¾à®© à®ªà®£à®¿à®¨à¯€à®•à¯à®• à®…à®Ÿà®¿à®ªà¯à®ªà®Ÿà¯ˆà®•à®³à¯",
      "à®¤à¯Šà®´à®¿à®²à®¾à®³à®°à¯ à®…à®²à¯à®µà®²à®•à®®à¯, à®šà®®à®°à®šà®®à¯, à®¤à¯Šà®´à®¿à®²à®¾à®³à®°à¯ à®¨à¯€à®¤à®¿à®®à®©à¯à®±à®®à¯ à®…à®£à¯à®•à¯à®®à¯ à®¨à®Ÿà¯ˆà®®à¯à®±à¯ˆ",
    ],
    referencesEn: [
      "Shops and Establishments compliance in TN",
      "Industrial dispute handling steps",
      "Workplace harassment complaint process",
    ],
    referencesTa: [
      "à®¤à®®à®¿à®´à¯à®¨à®¾à®Ÿà¯à®Ÿà®¿à®²à¯ à®•à®Ÿà¯ˆà®•à®³à¯ à®®à®±à¯à®±à¯à®®à¯ à®¨à®¿à®±à¯à®µà®©à®™à¯à®•à®³à¯ à®‡à®£à®•à¯à®•à®®à¯",
      "à®¤à¯Šà®´à®¿à®²à¯à®¤à¯à®±à¯ˆà®¤à¯ à®¤à®•à®°à®¾à®±à¯ à®¤à¯€à®°à¯à®µà¯ à®¨à®Ÿà®µà®Ÿà®¿à®•à¯à®•à¯ˆà®•à®³à¯",
      "à®ªà®£à®¿à®¯à®¿à®Ÿ à®¤à¯à®©à¯à®ªà¯à®±à¯à®¤à¯à®¤à®²à¯ à®ªà¯à®•à®¾à®°à¯ à®¨à®Ÿà¯ˆà®®à¯à®±à¯ˆ",
    ],
  },
  {
    id: 4,
    icon: <Heart className="w-6 h-6" />,
    titleEn: "Family & Marriage",
    titleTa: "\u0b95\u0bc1\u0b9f\u0bc1\u0bae\u0bcd\u0baa\u0bae\u0bcd & \u0ba4\u0bbf\u0bb0\u0bc1\u0bae\u0ba3\u0bae\u0bcd",
    descriptionEn: "Divorce, maintenance, child custody, inheritance",
    descriptionTa: "\u0bb5\u0bbf\u0bb5\u0bbe\u0b95\u0bb0\u0ba4\u0bcd\u0ba4\u0bc1, \u0baa\u0bb0\u0bbe\u0bae\u0bb0\u0bbf\u0baa\u0bcd\u0baa\u0bc1, \u0b95\u0bc1\u0bb4\u0ba8\u0bcd\u0ba4\u0bc8 \u0b95\u0bbe\u0bb5\u0bb2\u0bcd, \u0baa\u0bbe\u0bb0\u0bae\u0bcd\u0baa\u0bb0\u0bbf\u0baf\u0bae\u0bcd",
    overviewEn: "Designed for understanding marriage-related rights, maintenance claims, custody standards, and family settlement pathways.",
    overviewTa: "à®¤à®¿à®°à¯à®®à®£à®®à¯ à®¤à¯Šà®Ÿà®°à¯à®ªà®¾à®© à®‰à®°à®¿à®®à¯ˆà®•à®³à¯, à®ªà®°à®¾à®®à®°à®¿à®ªà¯à®ªà¯ à®•à¯‹à®°à®¿à®•à¯à®•à¯ˆ, à®•à¯à®´à®¨à¯à®¤à¯ˆ à®•à®¾à®µà®²à¯ à®…à®³à®µà¯à®•à¯‹à®²à¯à®•à®³à¯ à®®à®±à¯à®±à¯à®®à¯ à®•à¯à®Ÿà¯à®®à¯à®ª à®šà®®à®°à®š à®¨à®Ÿà¯ˆà®®à¯à®±à¯ˆà®•à®³à¯ˆ à®ªà¯à®°à®¿à®¯ à®‡à®¨à¯à®¤ à®ªà®•à¯à®¤à®¿ à®‰à®¤à®µà¯à®®à¯.",
    learnEn: [
      "Grounds and process for divorce and judicial separation",
      "Maintenance calculation factors for spouse, child, and parents",
      "Child custody: welfare principle and visitation arrangements",
    ],
    learnTa: [
      "à®µà®¿à®µà®¾à®•à®°à®¤à¯à®¤à¯ à®®à®±à¯à®±à¯à®®à¯ à®¨à¯€à®¤à®¿à®®à®©à¯à®± à®ªà®¿à®°à®¿à®µà®¿à®±à¯à®•à®¾à®© à®•à®¾à®°à®£à®™à¯à®•à®³à¯, à®¨à®Ÿà¯ˆà®®à¯à®±à¯ˆ",
      "à®®à®©à¯ˆà®µà®¿, à®•à¯à®´à®¨à¯à®¤à¯ˆ, à®ªà¯†à®±à¯à®±à¯‹à®°à¯ à®ªà®°à®¾à®®à®°à®¿à®ªà¯à®ªà¯ à®¤à¯Šà®•à¯ˆ à®•à®£à®•à¯à®•à¯€à®Ÿà¯à®Ÿà¯ à®•à®¾à®°à®£à®¿à®•à®³à¯",
      "à®•à¯à®´à®¨à¯à®¤à¯ˆ à®•à®¾à®µà®²à¯: à®•à¯à®´à®¨à¯à®¤à¯ˆ à®¨à®²à®©à¯ à®…à®Ÿà®¿à®ªà¯à®ªà®Ÿà¯ˆ à®®à®±à¯à®±à¯à®®à¯ à®šà®¨à¯à®¤à®¿à®ªà¯à®ªà¯ à®‰à®°à®¿à®®à¯ˆ",
    ],
    referencesEn: [
      "Family court filing and mediation route",
      "Domestic violence protection framework",
      "Succession and inheritance basics",
    ],
    referencesTa: [
      "à®•à¯à®Ÿà¯à®®à¯à®ª à®¨à¯€à®¤à®¿à®®à®©à¯à®± à®®à®©à¯ à®®à®±à¯à®±à¯à®®à¯ à®šà®®à®°à®š à®¨à®Ÿà¯ˆà®®à¯à®±à¯ˆ",
      "à®•à¯à®Ÿà¯à®®à¯à®ª à®µà®©à¯à®®à¯à®±à¯ˆ à®ªà®¾à®¤à¯à®•à®¾à®ªà¯à®ªà¯ à®šà®Ÿà¯à®Ÿ à®…à®®à¯ˆà®ªà¯à®ªà¯",
      "à®ªà®¾à®°à®®à¯à®ªà®°à®¿à®¯ à®‰à®°à®¿à®®à¯ˆ à®…à®Ÿà®¿à®ªà¯à®ªà®Ÿà¯ˆ à®•à¯‹à®Ÿà¯à®ªà®¾à®Ÿà¯à®•à®³à¯",
    ],
  },
  {
    id: 5,
    icon: <Scale className="w-6 h-6" />,
    titleEn: "Civil Disputes",
    titleTa: "\u0b9a\u0bbf\u0bb5\u0bbf\u0bb2\u0bcd \u0bb5\u0bb4\u0b95\u0bcd\u0b95\u0bc1\u0b95\u0bb3\u0bcd",
    descriptionEn: "Consumer complaints, contract issues, monetary disputes",
    descriptionTa: "\u0ba8\u0bc1\u0b95\u0bb0\u0bcd\u0bb5\u0bcb\u0bb0\u0bcd \u0baa\u0bc1\u0b95\u0bbe\u0bb0\u0bcd\u0b95\u0bb3\u0bcd, \u0b92\u0baa\u0bcd\u0baa\u0ba8\u0bcd\u0ba4 \u0baa\u0bbf\u0bb0\u0b9a\u0bcd\u0b9a\u0ba9\u0bc8\u0b95\u0bb3\u0bcd, \u0baa\u0ba3 \u0bb5\u0bbf\u0bb5\u0b95\u0bbe\u0bb0\u0b99\u0bcd\u0b95\u0bb3\u0bcd",
    overviewEn: "This category gives practical understanding of civil suits, recovery claims, contract breach remedies, and consumer complaint channels.",
    overviewTa: "à®šà®¿à®µà®¿à®²à¯ à®µà®´à®•à¯à®•à¯, à®ªà®£ à®®à¯€à®Ÿà¯à®ªà¯ à®®à®©à¯, à®’à®ªà¯à®ªà®¨à¯à®¤ à®®à¯€à®±à®²à¯ à®¤à¯€à®°à¯à®µà¯ à®®à®±à¯à®±à¯à®®à¯ à®¨à¯à®•à®°à¯à®µà¯‹à®°à¯ à®ªà¯à®•à®¾à®°à¯ à®µà®´à®¿à®®à¯à®±à¯ˆà®•à®³à¯ à®ªà®±à¯à®±à®¿à®¯ à®¨à®Ÿà¯ˆà®®à¯à®±à¯ˆ à®ªà¯à®°à®¿à®¤à®²à¯ˆ à®‡à®¨à¯à®¤ à®ªà®•à¯à®¤à®¿ à®µà®´à®™à¯à®•à¯à®•à®¿à®±à®¤à¯.",
    learnEn: [
      "How to issue legal notice before filing a suit",
      "Cause of action, limitation period, and court fee basics",
      "Consumer commission vs civil court selection guidance",
    ],
    learnTa: [
      "à®µà®´à®•à¯à®•à¯ à®®à¯à®©à¯ à®šà®Ÿà¯à®Ÿ à®¨à¯‹à®Ÿà¯à®Ÿà¯€à®¸à¯ à®…à®©à¯à®ªà¯à®ªà¯à®®à¯ à®¨à®Ÿà¯ˆà®®à¯à®±à¯ˆ",
      "Cause of action, limitation period, court fee à®…à®Ÿà®¿à®ªà¯à®ªà®Ÿà¯ˆ",
      "à®¨à¯à®•à®°à¯à®µà¯‹à®°à¯ à®†à®£à¯ˆà®¯à®®à¯ à®®à®±à¯à®±à¯à®®à¯ à®šà®¿à®µà®¿à®²à¯ à®¨à¯€à®¤à®¿à®®à®©à¯à®±à®®à¯ à®¤à¯‡à®°à¯à®µà¯ à®µà®´à®¿à®•à®¾à®Ÿà¯à®Ÿà®²à¯",
    ],
    referencesEn: [
      "Civil Procedure Code fundamentals",
      "Contract enforcement pathways",
      "Consumer Protection complaint workflow",
    ],
    referencesTa: [
      "à®šà®¿à®µà®¿à®²à¯ à®¨à®Ÿà¯ˆà®®à¯à®±à¯ˆà®šà¯ à®šà®Ÿà¯à®Ÿ à®…à®Ÿà®¿à®ªà¯à®ªà®Ÿà¯ˆ",
      "à®’à®ªà¯à®ªà®¨à¯à®¤ à®…à®®à®²à®¾à®•à¯à®• à®¨à®Ÿà®µà®Ÿà®¿à®•à¯à®•à¯ˆà®•à®³à¯",
      "à®¨à¯à®•à®°à¯à®µà¯‹à®°à¯ à®ªà®¾à®¤à¯à®•à®¾à®ªà¯à®ªà¯ à®ªà¯à®•à®¾à®°à¯ à®¨à®Ÿà¯ˆà®®à¯à®±à¯ˆ",
    ],
  },
  {
    id: 6,
    icon: <Shield className="w-6 h-6" />,
    titleEn: "Criminal Laws",
    titleTa: "\u0b95\u0bc1\u0bb1\u0bcd\u0bb1\u0bb5\u0bbf\u0baf\u0bb2\u0bcd \u0b9a\u0b9f\u0bcd\u0b9f\u0b99\u0bcd\u0b95\u0bb3\u0bcd",
    descriptionEn: "FIR procedures, bail, court proceedings",
    descriptionTa: "FIR \u0ba8\u0b9f\u0bc8\u0bae\u0bc1\u0bb1\u0bc8\u0b95\u0bb3\u0bcd, \u0b9c\u0bbe\u0bae\u0bc0\u0ba9\u0bcd, \u0ba8\u0bc0\u0ba4\u0bbf\u0bae\u0ba9\u0bcd\u0bb1 \u0ba8\u0b9f\u0bc8\u0bae\u0bc1\u0bb1\u0bc8\u0b95\u0bb3\u0bcd",
    overviewEn: "Helps you study complaint registration, arrest protections, bail process, and key stages of criminal trial in plain language.",
    overviewTa: "à®ªà¯à®•à®¾à®°à¯ à®ªà®¤à®¿à®µà¯, à®•à¯ˆà®¤à¯ à®ªà®¾à®¤à¯à®•à®¾à®ªà¯à®ªà¯ à®‰à®°à®¿à®®à¯ˆà®•à®³à¯, à®œà®¾à®®à¯€à®©à¯ à®¨à®Ÿà¯ˆà®®à¯à®±à¯ˆ à®®à®±à¯à®±à¯à®®à¯ à®•à¯à®±à¯à®±à®µà®¿à®¯à®²à¯ à®µà®¿à®šà®¾à®°à®£à¯ˆà®¯à®¿à®©à¯ à®®à¯à®•à¯à®•à®¿à®¯ à®•à®Ÿà¯à®Ÿà®™à¯à®•à®³à¯ˆ à®Žà®³à®¿à®¯ à®®à¯à®±à¯ˆà®¯à®¿à®²à¯ à®‡à®¨à¯à®¤ à®ªà®•à¯à®¤à®¿ à®µà®¿à®³à®•à¯à®•à¯à®•à®¿à®±à®¤à¯.",
    learnEn: [
      "Difference between complaint, CSR, and FIR",
      "Anticipatory bail, regular bail, and conditions",
      "Charge sheet timeline and trial stage overview",
    ],
    learnTa: [
      "Complaint, CSR, FIR à®‡à®©à¯ à®µà¯‡à®±à¯à®ªà®¾à®Ÿà¯",
      "à®®à¯à®©à¯à®œà®¾à®®à¯€à®©à¯, à®šà®¾à®¤à®¾à®°à®£ à®œà®¾à®®à¯€à®©à¯ à®®à®±à¯à®±à¯à®®à¯ à®¨à®¿à®ªà®¨à¯à®¤à®©à¯ˆà®•à®³à¯",
      "Charge sheet à®•à®¾à®²à®µà®°à®®à¯à®ªà¯ à®®à®±à¯à®±à¯à®®à¯ à®µà®¿à®šà®¾à®°à®£à¯ˆ à®•à®Ÿà¯à®Ÿà®™à¯à®•à®³à¯",
    ],
    referencesEn: [
      "BNS/BNSS procedural framework",
      "Rights of accused and victim support process",
      "Police complaint escalation pathways",
    ],
    referencesTa: [
      "BNS/BNSS à®¨à®Ÿà¯ˆà®®à¯à®±à¯ˆ à®šà®Ÿà¯à®Ÿ à®…à®®à¯ˆà®ªà¯à®ªà¯",
      "à®•à¯à®±à¯à®±à®®à¯ à®šà®¾à®Ÿà¯à®Ÿà®ªà¯à®ªà®Ÿà¯à®Ÿà®µà®°à¯ à®®à®±à¯à®±à¯à®®à¯ à®ªà®¾à®¤à®¿à®•à¯à®•à®ªà¯à®ªà®Ÿà¯à®Ÿà®µà®°à¯ à®‰à®°à®¿à®®à¯ˆà®•à®³à¯",
      "à®ªà¯‹à®²à¯€à®¸à¯ à®ªà¯à®•à®¾à®°à¯ à®®à¯‡à®²à¯à®®à¯à®±à¯ˆà®¯à¯€à®Ÿà¯à®Ÿà¯ à®µà®´à®¿à®•à®³à¯",
    ],
  },
  {
    id: 7,
    icon: <BookOpen className="w-6 h-6" />,
    titleEn: "Education Rights",
    titleTa: "\u0b95\u0bb2\u0bcd\u0bb5\u0bbf \u0b89\u0bb0\u0bbf\u0bae\u0bc8\u0b95\u0bb3\u0bcd",
    descriptionEn: "Admission issues, reservation policies, fee structure",
    descriptionTa: "\u0b9a\u0bc7\u0bb0\u0bcd\u0b95\u0bcd\u0b95\u0bc8 \u0baa\u0bbf\u0bb0\u0b9a\u0bcd\u0b9a\u0ba9\u0bc8\u0b95\u0bb3\u0bcd, \u0b87\u0b9f\u0b92\u0ba4\u0bc1\u0b95\u0bcd\u0b95\u0bc0\u0b9f\u0bcd\u0b9f\u0bc1 \u0b95\u0bca\u0bb3\u0bcd\u0b95\u0bc8\u0b95\u0bb3\u0bcd, \u0b95\u0b9f\u0bcd\u0b9f\u0ba3 \u0b85\u0bae\u0bc8\u0baa\u0bcd\u0baa\u0bc1",
    overviewEn: "Use this section to understand admission rules, scholarship eligibility, reservation policy basics, and grievance mechanisms.",
    overviewTa: "à®šà¯‡à®°à¯à®•à¯à®•à¯ˆ à®µà®¿à®¤à®¿à®•à®³à¯, à®‰à®¤à®µà®¿à®¤à¯à®¤à¯Šà®•à¯ˆ à®¤à®•à¯à®¤à®¿, à®‡à®Ÿà®’à®¤à¯à®•à¯à®•à¯€à®Ÿà¯à®Ÿà¯ à®•à¯Šà®³à¯à®•à¯ˆ à®…à®Ÿà®¿à®ªà¯à®ªà®Ÿà¯ˆ à®®à®±à¯à®±à¯à®®à¯ à®ªà¯à®•à®¾à®°à¯ à®¤à¯€à®°à¯à®µà¯ à®…à®®à¯ˆà®ªà¯à®ªà¯à®•à®³à¯ˆ à®‡à®¨à¯à®¤ à®ªà®•à¯à®¤à®¿ à®…à®±à®¿à®®à¯à®•à®ªà¯à®ªà®Ÿà¯à®¤à¯à®¤à¯à®•à®¿à®±à®¤à¯.",
    learnEn: [
      "School and college admission documentation standards",
      "Reservation matrix and certificate validation basics",
      "Fee regulation and student grievance channels",
    ],
    learnTa: [
      "à®ªà®³à¯à®³à®¿ à®®à®±à¯à®±à¯à®®à¯ à®•à®²à¯à®²à¯‚à®°à®¿ à®šà¯‡à®°à¯à®•à¯à®•à¯ˆ à®†à®µà®£à®¤à¯ à®¤à®°à®¨à®¿à®²à¯ˆà®•à®³à¯",
      "à®‡à®Ÿà®’à®¤à¯à®•à¯à®•à¯€à®Ÿà¯ à®…à®®à¯ˆà®ªà¯à®ªà¯ à®®à®±à¯à®±à¯à®®à¯ à®šà®¾à®©à¯à®±à®¿à®¤à®´à¯ à®šà®°à®¿à®ªà®¾à®°à¯à®ªà¯à®ªà¯ à®…à®Ÿà®¿à®ªà¯à®ªà®Ÿà¯ˆ",
      "à®•à®Ÿà¯à®Ÿà®£ à®•à®Ÿà¯à®Ÿà¯à®ªà¯à®ªà®¾à®Ÿà¯ à®®à®±à¯à®±à¯à®®à¯ à®®à®¾à®£à®µà®°à¯ à®ªà¯à®•à®¾à®°à¯ à®µà®´à®¿à®•à®³à¯",
    ],
    referencesEn: [
      "State education department grievance route",
      "Scholarship process and common rejection reasons",
      "Student rights in private institutions",
    ],
    referencesTa: [
      "à®®à®¾à®¨à®¿à®²à®•à¯ à®•à®²à¯à®µà®¿à®¤à¯à®¤à¯à®±à¯ˆ à®ªà¯à®•à®¾à®°à¯ à®¤à¯€à®°à¯à®µà¯ à®µà®´à®¿à®•à®³à¯",
      "à®‰à®¤à®µà®¿à®¤à¯à®¤à¯Šà®•à¯ˆ à®¨à®Ÿà¯ˆà®®à¯à®±à¯ˆ à®®à®±à¯à®±à¯à®®à¯ à®¨à®¿à®°à®¾à®•à®°à®¿à®ªà¯à®ªà¯ à®•à®¾à®°à®£à®™à¯à®•à®³à¯",
      "à®¤à®©à®¿à®¯à®¾à®°à¯ à®•à®²à¯à®µà®¿ à®¨à®¿à®±à¯à®µà®©à®™à¯à®•à®³à®¿à®²à¯ à®®à®¾à®£à®µà®°à¯ à®‰à®°à®¿à®®à¯ˆà®•à®³à¯",
    ],
  },
  {
    id: 8,
    icon: <Building className="w-6 h-6" />,
    titleEn: "Government Schemes",
    titleTa: "\u0b85\u0bb0\u0b9a\u0bc1 \u0ba4\u0bbf\u0b9f\u0bcd\u0b9f\u0b99\u0bcd\u0b95\u0bb3\u0bcd",
    descriptionEn: "TN welfare schemes, subsidies, application procedures",
    descriptionTa: "\u0ba4\u0bae\u0bbf\u0bb4\u0bcd\u0ba8\u0bbe\u0b9f\u0bc1 \u0ba8\u0bb2\u0ba4\u0bcd\u0ba4\u0bbf\u0b9f\u0bcd\u0b9f\u0b99\u0bcd\u0b95\u0bb3\u0bcd, \u0bae\u0bbe\u0ba9\u0bbf\u0baf\u0b99\u0bcd\u0b95\u0bb3\u0bcd, \u0bb5\u0bbf\u0ba3\u0bcd\u0ba3\u0baa\u0bcd\u0baa \u0ba8\u0b9f\u0bc8\u0bae\u0bc1\u0bb1\u0bc8\u0b95\u0bb3\u0bcd",
    overviewEn: "Covers welfare eligibility checks, document readiness, benefit tracking, and appeal options if a scheme request is rejected.",
    overviewTa: "à®¨à®²à®¤à¯à®¤à®¿à®Ÿà¯à®Ÿ à®¤à®•à¯à®¤à®¿ à®šà®°à®¿à®ªà®¾à®°à¯à®ªà¯à®ªà¯, à®†à®µà®£à®¤à¯ à®¤à®¯à®¾à®°à®¿à®ªà¯à®ªà¯, à®ªà®¯à®©à¯ à®¨à®¿à®²à¯ˆ à®•à®£à¯à®•à®¾à®£à®¿à®ªà¯à®ªà¯, à®µà®¿à®£à¯à®£à®ªà¯à®ªà®®à¯ à®¨à®¿à®°à®¾à®•à®°à®¿à®•à¯à®•à®ªà¯à®ªà®Ÿà¯à®Ÿà®¾à®²à¯ à®®à¯‡à®²à¯à®®à¯à®±à¯ˆà®¯à¯€à®Ÿà¯à®Ÿà¯ à®µà®´à®¿à®•à®³à¯ à®†à®•à®¿à®¯à®µà®±à¯à®±à¯ˆ à®‡à®¨à¯à®¤ à®ªà®•à¯à®¤à®¿ à®µà®¿à®³à®•à¯à®•à¯à®•à®¿à®±à®¤à¯.",
    learnEn: [
      "How to verify eligibility before applying",
      "Common document checklist for welfare applications",
      "How to track status and escalate delays",
    ],
    learnTa: [
      "à®µà®¿à®£à¯à®£à®ªà¯à®ªà®¿à®•à¯à®•à¯à®®à¯ à®®à¯à®©à¯ à®¤à®•à¯à®¤à®¿à®¯à¯ˆ à®šà®°à®¿à®ªà®¾à®°à¯à®ªà¯à®ªà®¤à¯ à®Žà®ªà¯à®ªà®Ÿà®¿",
      "à®¨à®²à®¤à¯à®¤à®¿à®Ÿà¯à®Ÿ à®µà®¿à®£à¯à®£à®ªà¯à®ªà®™à¯à®•à®³à¯à®•à¯à®•à¯ à®ªà¯Šà®¤à¯à®µà®¾à®© à®†à®µà®£à®ªà¯ à®ªà®Ÿà¯à®Ÿà®¿à®¯à®²à¯",
      "à®¨à®¿à®²à¯ˆ à®•à®£à¯à®•à®¾à®£à®¿à®ªà¯à®ªà¯ à®®à®±à¯à®±à¯à®®à¯ à®¤à®¾à®®à®¤à®¤à¯à®¤à®¿à®±à¯à®•à¯ à®®à¯‡à®²à¯à®®à¯à®±à¯ˆà®¯à¯€à®Ÿà¯à®Ÿà¯ à®¨à®Ÿà¯ˆà®®à¯à®±à¯ˆ",
    ],
    referencesEn: [
      "e-Sevai and district office process",
      "Subsidy and beneficiary verification workflow",
      "Appeal route for rejected applications",
    ],
    referencesTa: [
      "e-Sevai à®®à®±à¯à®±à¯à®®à¯ à®®à®¾à®µà®Ÿà¯à®Ÿ à®…à®²à¯à®µà®²à®• à®¨à®Ÿà¯ˆà®®à¯à®±à¯ˆ",
      "à®®à®¾à®©à®¿à®¯à®®à¯ à®®à®±à¯à®±à¯à®®à¯ à®ªà®¯à®©à®¾à®³à®¿ à®šà®°à®¿à®ªà®¾à®°à¯à®ªà¯à®ªà¯ à®¨à®Ÿà¯ˆà®®à¯à®±à¯ˆ",
      "à®¨à®¿à®°à®¾à®•à®°à®¿à®•à¯à®•à®ªà¯à®ªà®Ÿà¯à®Ÿ à®µà®¿à®£à¯à®£à®ªà¯à®ªà®™à¯à®•à®³à¯à®•à¯à®•à®¾à®© à®®à¯‡à®²à¯à®®à¯à®±à¯ˆà®¯à¯€à®Ÿà¯à®Ÿà¯ à®µà®´à®¿",
    ],
  },
  {
    id: 9,
    icon: <FileText className="w-6 h-6" />,
    titleEn: "RTI & Official Matters",
    titleTa: "RTI & \u0b85\u0ba4\u0bbf\u0b95\u0bbe\u0bb0\u0baa\u0bcd\u0baa\u0bc2\u0bb0\u0bcd\u0bb5 \u0bb5\u0bbf\u0bb5\u0b95\u0bbe\u0bb0\u0b99\u0bcd\u0b95\u0bb3\u0bcd",
    descriptionEn: "Right to Information, official document procedures",
    descriptionTa: "\u0ba4\u0b95\u0bb5\u0bb2\u0bcd \u0b85\u0bb1\u0bbf\u0baf\u0bc1\u0bae\u0bcd \u0b89\u0bb0\u0bbf\u0bae\u0bc8, \u0b85\u0ba4\u0bbf\u0b95\u0bbe\u0bb0\u0baa\u0bcd\u0baa\u0bc2\u0bb0\u0bcd\u0bb5 \u0b86\u0bb5\u0ba3 \u0ba8\u0b9f\u0bc8\u0bae\u0bc1\u0bb1\u0bc8\u0b95\u0bb3\u0bcd",
    overviewEn: "Learn how to draft RTI requests, follow statutory timelines, and approach first/second appeals for delayed or denied information.",
    overviewTa: "RTI à®®à®©à¯ à®µà®Ÿà®¿à®µà®®à¯ˆà®ªà¯à®ªà¯, à®šà®Ÿà¯à®Ÿ à®•à®¾à®²à®µà®°à®®à¯à®ªà¯à®•à®³à¯, à®¤à®•à®µà®²à¯ à®¤à®¾à®®à®¤à®®à¯/à®¨à®¿à®°à®¾à®•à®°à®¿à®ªà¯à®ªà¯ à®à®±à¯à®ªà®Ÿà¯à®Ÿà®¾à®²à¯ à®®à¯à®¤à®²à¯ à®®à®±à¯à®±à¯à®®à¯ à®‡à®°à®£à¯à®Ÿà®¾à®®à¯ à®®à¯‡à®²à¯à®®à¯à®±à¯ˆà®¯à¯€à®Ÿà¯à®Ÿà¯ à®¨à®Ÿà¯ˆà®®à¯à®±à¯ˆà®•à®³à¯ˆ à®‡à®¨à¯à®¤ à®ªà®•à¯à®¤à®¿ à®…à®±à®¿à®¯ à®‰à®¤à®µà¯à®®à¯.",
    learnEn: [
      "Correct format for RTI application and fee requirements",
      "PIO response timeline and exemptions overview",
      "First appeal and information commission escalation flow",
    ],
    learnTa: [
      "RTI à®®à®©à¯ à®µà®Ÿà®¿à®µà®®à¯ à®®à®±à¯à®±à¯à®®à¯ à®•à®Ÿà¯à®Ÿà®£ à®¨à®¿à®ªà®¨à¯à®¤à®©à¯ˆà®•à®³à¯",
      "PIO à®ªà®¤à®¿à®²à¯ à®•à®¾à®²à®µà®°à®®à¯à®ªà¯ à®®à®±à¯à®±à¯à®®à¯ à®µà®¿à®²à®•à¯à®•à¯ à®µà®¿à®¤à®¿à®•à®³à¯",
      "à®®à¯à®¤à®²à¯ à®®à¯‡à®²à¯à®®à¯à®±à¯ˆà®¯à¯€à®Ÿà¯ à®®à®±à¯à®±à¯à®®à¯ à®¤à®•à®µà®²à¯ à®†à®£à¯ˆà®¯ à®®à¯‡à®²à¯à®®à¯à®±à¯ˆà®¯à¯€à®Ÿà¯à®Ÿà¯ à®¨à®Ÿà¯ˆà®®à¯à®±à¯ˆ",
    ],
    referencesEn: [
      "RTI Act process map",
      "Public record request best practices",
      "Appeal drafting checklist",
    ],
    referencesTa: [
      "RTI à®šà®Ÿà¯à®Ÿ à®¨à®Ÿà¯ˆà®®à¯à®±à¯ˆ à®µà®°à¯ˆà®ªà®Ÿà®®à¯",
      "à®ªà¯Šà®¤à¯ à®ªà®¤à®¿à®µà¯à®•à®³à¯ à®•à¯‹à®°à®¿à®•à¯à®•à¯ˆ à®šà¯†à®¯à¯à®¯à¯à®®à¯ à®šà®¿à®±à®¨à¯à®¤ à®¨à®Ÿà¯ˆà®®à¯à®±à¯ˆà®•à®³à¯",
      "à®®à¯‡à®²à¯à®®à¯à®±à¯ˆà®¯à¯€à®Ÿà¯à®Ÿà¯ à®®à®©à¯ à®¤à®¯à®¾à®°à®¿à®ªà¯à®ªà¯ à®ªà®Ÿà¯à®Ÿà®¿à®¯à®²à¯",
    ],
  },
  {
    id: 10,
    icon: <Users className="w-6 h-6" />,
    titleEn: "Women & Child Rights",
    titleTa: "\u0baa\u0bc6\u0ba3\u0bcd\u0b95\u0bb3\u0bcd & \u0b95\u0bc1\u0bb4\u0ba8\u0bcd\u0ba4\u0bc8 \u0b89\u0bb0\u0bbf\u0bae\u0bc8\u0b95\u0bb3\u0bcd",
    descriptionEn: "Protection laws, harassment, child welfare",
    descriptionTa: "\u0baa\u0bbe\u0ba4\u0bc1\u0b95\u0bbe\u0baa\u0bcd\u0baa\u0bc1 \u0b9a\u0b9f\u0bcd\u0b9f\u0b99\u0bcd\u0b95\u0bb3\u0bcd, \u0ba4\u0bca\u0ba8\u0bcd\u0ba4\u0bb0\u0bb5\u0bc1, \u0b95\u0bc1\u0bb4\u0ba8\u0bcd\u0ba4\u0bc8 \u0ba8\u0bb2\u0ba9\u0bcd",
    overviewEn: "Explains legal protection against abuse, immediate safety options, support services, and child welfare complaint pathways.",
    overviewTa: "à®¤à¯à®©à¯à®ªà¯à®±à¯à®¤à¯à®¤à®²à¯à®•à¯à®•à¯ à®Žà®¤à®¿à®°à®¾à®© à®šà®Ÿà¯à®Ÿ à®ªà®¾à®¤à¯à®•à®¾à®ªà¯à®ªà¯, à®‰à®Ÿà®©à®Ÿà®¿ à®ªà®¾à®¤à¯à®•à®¾à®ªà¯à®ªà¯ à®¨à®Ÿà®µà®Ÿà®¿à®•à¯à®•à¯ˆà®•à®³à¯, à®†à®¤à®°à®µà¯ à®šà¯‡à®µà¯ˆà®•à®³à¯ à®®à®±à¯à®±à¯à®®à¯ à®•à¯à®´à®¨à¯à®¤à¯ˆ à®¨à®² à®ªà¯à®•à®¾à®°à¯ à®µà®´à®¿à®®à¯à®±à¯ˆà®•à®³à¯ à®†à®•à®¿à®¯à®µà®±à¯à®±à¯ˆ à®‡à®¨à¯à®¤ à®ªà®•à¯à®¤à®¿ à®µà®¿à®³à®•à¯à®•à¯à®•à®¿à®±à®¤à¯.",
    learnEn: [
      "Domestic violence remedies and protection orders",
      "Sexual harassment complaint systems and timelines",
      "Child safety reporting and Child Welfare Committee role",
    ],
    learnTa: [
      "à®•à¯à®Ÿà¯à®®à¯à®ª à®µà®©à¯à®®à¯à®±à¯ˆà®•à¯à®•à®¾à®© à®šà®Ÿà¯à®Ÿ à®¨à®¿à®µà®¾à®°à®£à®™à¯à®•à®³à¯ à®®à®±à¯à®±à¯à®®à¯ à®ªà®¾à®¤à¯à®•à®¾à®ªà¯à®ªà¯ à®†à®£à¯ˆà®•à®³à¯",
      "à®ªà®¾à®²à®¿à®¯à®²à¯ à®¤à¯à®©à¯à®ªà¯à®±à¯à®¤à¯à®¤à®²à¯ à®ªà¯à®•à®¾à®°à¯ à®…à®®à¯ˆà®ªà¯à®ªà¯ à®®à®±à¯à®±à¯à®®à¯ à®•à®¾à®²à®µà®°à®®à¯à®ªà¯à®•à®³à¯",
      "à®•à¯à®´à®¨à¯à®¤à¯ˆ à®ªà®¾à®¤à¯à®•à®¾à®ªà¯à®ªà¯ à®ªà¯à®•à®¾à®°à¯ à®®à®±à¯à®±à¯à®®à¯ Child Welfare Committee à®ªà®™à¯à®•à¯",
    ],
    referencesEn: [
      "POCSO and women protection legal framework",
      "One-stop center and helpline support options",
      "Compensation and rehabilitation support process",
    ],
    referencesTa: [
      "POCSO à®®à®±à¯à®±à¯à®®à¯ à®ªà¯†à®£à¯à®•à®³à¯ à®ªà®¾à®¤à¯à®•à®¾à®ªà¯à®ªà¯ à®šà®Ÿà¯à®Ÿ à®…à®®à¯ˆà®ªà¯à®ªà¯",
      "One-stop center à®®à®±à¯à®±à¯à®®à¯ à®‰à®¤à®µà®¿ à®Žà®£à¯ à®šà¯‡à®µà¯ˆà®•à®³à¯",
      "à®‡à®´à®ªà¯à®ªà¯€à®Ÿà¯ à®®à®±à¯à®±à¯à®®à¯ à®®à¯€à®³à®®à¯ˆà®ªà¯à®ªà¯ à®‰à®¤à®µà®¿ à®¨à®Ÿà¯ˆà®®à¯à®±à¯ˆ",
    ],
  },
  {
    id: 11,
    icon: <GraduationCap className="w-6 h-6" />,
    titleEn: "Professional Regulations",
    titleTa: "\u0ba4\u0bca\u0bb4\u0bbf\u0bb2\u0bcd\u0bae\u0bc1\u0bb1\u0bc8 \u0bb5\u0bbf\u0ba4\u0bbf\u0bae\u0bc1\u0bb1\u0bc8\u0b95\u0bb3\u0bcd",
    descriptionEn: "Medical, legal, engineering professional conduct",
    descriptionTa: "\u0bae\u0bb0\u0bc1\u0ba4\u0bcd\u0ba4\u0bc1\u0bb5\u0bae\u0bcd, \u0b9a\u0b9f\u0bcd\u0b9f\u0bae\u0bcd, \u0baa\u0bca\u0bb1\u0bbf\u0baf\u0bbf\u0baf\u0bb2\u0bcd \u0ba4\u0bca\u0bb4\u0bbf\u0bb2\u0bcd\u0bae\u0bc1\u0bb1\u0bc8 \u0ba8\u0b9f\u0ba4\u0bcd\u0ba4\u0bc8",
    overviewEn: "For professionals and clients to understand licensing norms, disciplinary action process, and complaint filing before regulatory bodies.",
    overviewTa: "à®¤à¯Šà®´à®¿à®²à¯à®®à¯à®±à¯ˆ à®¨à®¿à®ªà¯à®£à®°à¯à®•à®³à¯ à®®à®±à¯à®±à¯à®®à¯ à®ªà¯Šà®¤à¯à®®à®•à¯à®•à®³à¯ à®‰à®°à®¿à®®à¯ˆà®•à®³à¯à®•à¯à®•à®¾à®• à®‰à®°à®¿à®®à®®à¯ à®µà®¿à®¤à®¿à®•à®³à¯, à®’à®´à¯à®™à¯à®•à¯ à®¨à®Ÿà®µà®Ÿà®¿à®•à¯à®•à¯ˆ à®¨à®Ÿà¯ˆà®®à¯à®±à¯ˆ à®®à®±à¯à®±à¯à®®à¯ à®•à®Ÿà¯à®Ÿà¯à®ªà¯à®ªà®¾à®Ÿà¯à®Ÿà¯ à®…à®®à¯ˆà®ªà¯à®ªà¯à®•à®³à®¿à®²à¯ à®ªà¯à®•à®¾à®°à¯ à®…à®³à®¿à®•à¯à®•à¯à®®à¯ à®®à¯à®±à¯ˆà®•à®³à¯ˆ à®‡à®¨à¯à®¤ à®ªà®•à¯à®¤à®¿ à®µà®¿à®³à®•à¯à®•à¯à®•à®¿à®±à®¤à¯.",
    learnEn: [
      "Registration and license renewal expectations",
      "Code of conduct and professional negligence basics",
      "Disciplinary inquiry and appeal routes",
    ],
    learnTa: [
      "à®ªà®¤à®¿à®µà¯ à®®à®±à¯à®±à¯à®®à¯ à®‰à®°à®¿à®®à®®à¯ à®ªà¯à®¤à¯à®ªà¯à®ªà®¿à®ªà¯à®ªà¯ à®¨à®¿à®ªà®¨à¯à®¤à®©à¯ˆà®•à®³à¯",
      "à®¨à®Ÿà®¤à¯à®¤à¯ˆ à®µà®¿à®¤à®¿à®®à¯à®±à¯ˆ à®®à®±à¯à®±à¯à®®à¯ à®¤à¯Šà®´à®¿à®²à¯à®®à¯à®±à¯ˆ à®…à®²à®Ÿà¯à®šà®¿à®¯à®®à¯ à®…à®Ÿà®¿à®ªà¯à®ªà®Ÿà¯ˆ",
      "à®’à®´à¯à®™à¯à®•à¯ à®µà®¿à®šà®¾à®°à®£à¯ˆ à®®à®±à¯à®±à¯à®®à¯ à®®à¯‡à®²à¯à®®à¯à®±à¯ˆà®¯à¯€à®Ÿà¯à®Ÿà¯ à®µà®´à®¿à®•à®³à¯",
    ],
    referencesEn: [
      "Council complaint filing sequence",
      "Documenting misconduct with evidence",
      "Sanctions and remediation options",
    ],
    referencesTa: [
      "à®•à®µà¯à®©à¯à®šà®¿à®²à¯ à®ªà¯à®•à®¾à®°à¯ à®…à®³à®¿à®•à¯à®•à¯à®®à¯ à®ªà®Ÿà®¿à®¨à®¿à®²à¯ˆ à®¨à®Ÿà¯ˆà®®à¯à®±à¯ˆ",
      "à®šà®¾à®©à¯à®±à¯à®•à®³à¯à®Ÿà®©à¯ à®¤à®µà®±à®¾à®© à®šà¯†à®¯à®²à¯à®•à®³à¯ˆ à®ªà®¤à®¿à®µà¯ à®šà¯†à®¯à¯à®µà®¤à¯",
      "à®¤à®£à¯à®Ÿà®©à¯ˆ à®®à®±à¯à®±à¯à®®à¯ à®¤à®¿à®°à¯à®¤à¯à®¤ à®¨à®Ÿà®µà®Ÿà®¿à®•à¯à®•à¯ˆ à®µà®¾à®¯à¯à®ªà¯à®ªà¯à®•à®³à¯",
    ],
  },
  {
    id: 12,
    icon: <MessageSquare className="w-6 h-6" />,
    titleEn: "Cyber & Digital Laws",
    titleTa: "\u0b9a\u0bc8\u0baa\u0bb0\u0bcd & \u0b9f\u0bbf\u0b9c\u0bbf\u0b9f\u0bcd\u0b9f\u0bb2\u0bcd \u0b9a\u0b9f\u0bcd\u0b9f\u0b99\u0bcd\u0b95\u0bb3\u0bcd",
    descriptionEn: "Online fraud, data privacy, digital signatures",
    descriptionTa: "\u0b86\u0ba9\u0bcd\u0bb2\u0bc8\u0ba9\u0bcd \u0bae\u0bcb\u0b9a\u0b9f\u0bbf, \u0ba4\u0bb0\u0bb5\u0bc1 \u0ba4\u0ba9\u0bbf\u0baf\u0bc1\u0bb0\u0bbf\u0bae\u0bc8, \u0b9f\u0bbf\u0b9c\u0bbf\u0b9f\u0bcd\u0b9f\u0bb2\u0bcd \u0b95\u0bc8\u0baf\u0bca\u0baa\u0bcd\u0baa\u0b99\u0bcd\u0b95\u0bb3\u0bcd",
    overviewEn: "Covers cyber fraud reporting, social media abuse response, digital evidence preservation, and privacy-related legal actions.",
    overviewTa: "à®šà¯ˆà®ªà®°à¯ à®®à¯‹à®šà®Ÿà®¿ à®ªà¯à®•à®¾à®°à¯, à®šà®®à¯‚à®• à®Šà®Ÿà®• à®¤à¯à®©à¯à®ªà¯à®±à¯à®¤à¯à®¤à®²à¯ à®Žà®¤à®¿à®°à¯à®µà®¿à®©à¯ˆ, à®Ÿà®¿à®œà®¿à®Ÿà¯à®Ÿà®²à¯ à®šà®¾à®©à¯à®±à¯à®•à®³à¯ à®ªà®¾à®¤à¯à®•à®¾à®ªà¯à®ªà¯ à®®à®±à¯à®±à¯à®®à¯ à®¤à®©à®¿à®¯à¯à®°à®¿à®®à¯ˆ à®¤à¯Šà®Ÿà®°à¯à®ªà®¾à®© à®šà®Ÿà¯à®Ÿ à®¨à®Ÿà®µà®Ÿà®¿à®•à¯à®•à¯ˆà®•à®³à¯ˆ à®‡à®¨à¯à®¤ à®ªà®•à¯à®¤à®¿ à®µà®¿à®³à®•à¯à®•à¯à®•à®¿à®±à®¤à¯.",
    learnEn: [
      "Immediate steps for online payment fraud and account compromise",
      "How to preserve screenshots, logs, and transaction records",
      "Cybercrime portal, police complaint, and follow-up process",
    ],
    learnTa: [
      "à®†à®©à¯à®²à¯ˆà®©à¯ à®ªà®£à®®à¯‹à®šà®Ÿà®¿ à®®à®±à¯à®±à¯à®®à¯ à®•à®£à®•à¯à®•à¯ à®¹à¯‡à®•à¯ à®à®±à¯à®ªà®Ÿà¯à®Ÿà®¾à®²à¯ à®‰à®Ÿà®©à®Ÿà®¿ à®¨à®Ÿà®µà®Ÿà®¿à®•à¯à®•à¯ˆà®•à®³à¯",
      "à®¸à¯à®•à®¿à®°à¯€à®©à¯ à®·à®¾à®Ÿà¯, à®²à®¾à®•à¯, à®ªà®°à®¿à®µà®°à¯à®¤à¯à®¤à®©à¯ˆ à®†à®µà®£à®™à¯à®•à®³à¯ à®ªà®¾à®¤à¯à®•à®¾à®ªà¯à®ªà¯ à®¨à®Ÿà¯ˆà®®à¯à®±à¯ˆ",
      "à®šà¯ˆà®ªà®°à¯ à®•à¯à®±à¯à®± à®¤à®³à®®à¯, à®ªà¯‹à®²à¯€à®¸à¯ à®ªà¯à®•à®¾à®°à¯ à®®à®±à¯à®±à¯à®®à¯ à®¤à¯Šà®Ÿà®°à¯à®¨à¯à®¤à¯ à®•à®£à¯à®•à®¾à®£à®¿à®•à¯à®•à¯à®®à¯ à®®à¯à®±à¯ˆ",
    ],
    referencesEn: [
      "IT Act and digital evidence principles",
      "Cyber complaint filing checklist",
      "Platform reporting and grievance escalation steps",
    ],
    referencesTa: [
      "IT Act à®®à®±à¯à®±à¯à®®à¯ à®Ÿà®¿à®œà®¿à®Ÿà¯à®Ÿà®²à¯ à®šà®¾à®©à¯à®±à¯à®•à®³à¯ à®ªà®±à¯à®±à®¿à®¯ à®…à®Ÿà®¿à®ªà¯à®ªà®Ÿà¯ˆ",
      "à®šà¯ˆà®ªà®°à¯ à®ªà¯à®•à®¾à®°à¯ à®®à®©à¯à®¤à¯ à®¤à®¾à®•à¯à®•à®²à¯ à®šà®°à®¿à®ªà®¾à®°à¯à®ªà¯à®ªà¯ à®ªà®Ÿà¯à®Ÿà®¿à®¯à®²à¯",
      "à®¤à®³ (platform) à®ªà¯à®•à®¾à®°à¯ à®®à®±à¯à®±à¯à®®à¯ à®®à¯‡à®²à¯à®®à¯à®±à¯ˆà®¯à¯€à®Ÿà¯à®Ÿà¯ à®¨à®Ÿà¯ˆà®®à¯à®±à¯ˆà®•à®³à¯",
    ],
  }
];

export default function Page() {
  const { isLoaded, userId } = useAuth();
  const [showChat, setShowChat] = useState(false);
  const [chatCategory, setChatCategory] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<LegalCategory | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [studyByCategoryId, setStudyByCategoryId] = useState<Record<number, BackendCategoryStudy>>({});
  const [isStudyLoading, setIsStudyLoading] = useState(false);
  const [studyError, setStudyError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!isLoaded || !userId) {
      return () => {
        cancelled = true;
      };
    }

    const fetchCategoryStudy = async () => {
      setIsStudyLoading(true);
      setStudyError(null);
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/v1/categories/study?language=${language}&k=8`,
          { cache: 'no-store' }
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch category study (${response.status})`);
        }

        const data = await response.json() as BackendCategoryStudy[];
        const map: Record<number, BackendCategoryStudy> = {};
        for (const item of data || []) {
          if (typeof item.id === 'number') {
            map[item.id] = item;
          }
        }
        if (!cancelled) {
          setStudyByCategoryId(map);
        }
      } catch (error) {
        if (!cancelled) {
          setStudyError(error instanceof Error ? error.message : 'Failed to load category study data');
          setStudyByCategoryId({});
        }
      } finally {
        if (!cancelled) {
          setIsStudyLoading(false);
        }
      }
    };

    fetchCategoryStudy();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, userId, language]);

  const dynamicStudy = selectedCategory ? studyByCategoryId[selectedCategory.id] : undefined;
  const selectedDescription = selectedCategory
    ? getLocalizedText(
      language,
      dynamicStudy?.description_en || selectedCategory.descriptionEn,
      dynamicStudy?.description_ta || selectedCategory.descriptionTa,
    )
    : '';
  const selectedOverview = selectedCategory
    ? getLocalizedText(
      language,
      selectedCategory.overviewEn,
      dynamicStudy?.overview || selectedCategory.overviewTa,
    )
    : '';
  const selectedLearnPoints = selectedCategory
    ? getLocalizedList(
      language,
      selectedCategory.learnEn,
      dynamicStudy?.learn_points?.length ? dynamicStudy.learn_points : selectedCategory.learnTa,
    )
    : [];
  const cleanedDynamicReferences = (dynamicStudy?.references || [])
    .map((ref) => String(ref).replace(/\s+/g, ' ').trim())
    .filter((ref) => ref.length > 0 && !isPdfLikeReference(ref));
  const selectedReferences = selectedCategory
    ? getLocalizedList(
      language,
      selectedCategory.referencesEn,
      cleanedDynamicReferences.length ? cleanedDynamicReferences : selectedCategory.referencesTa,
    )
    : [];
  const selectedTopics = selectedDescription
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-green-50 to-white">
        <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 py-12">
          <div className="w-full rounded-2xl border border-emerald-100 bg-white p-8 text-center shadow-lg">
            <h1 className="text-2xl font-bold text-gray-900">
              Loading...
            </h1>
          </div>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-green-50 to-white">
        <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 py-12">
          <div className="w-full rounded-2xl border border-emerald-100 bg-white p-8 text-center shadow-lg">
            <h1 className="text-3xl font-bold text-gray-900">
              Tamil Nadu Legal AI Assistant
            </h1>
            <p className="mt-3 text-gray-600">
              Please sign in to access the legal branches and chat assistant.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <SignInButton mode="modal">
                <button className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-600 bg-white px-5 py-2.5 font-semibold text-emerald-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2">
                  Sign Up
                </button>
              </SignUpButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showChat) {
    return <ChatInterface 
      category={chatCategory}
      onBack={() => setShowChat(false)} 
      language={language}
      onLanguageChange={(lang) => setLanguage(lang)}
    />;
  }

  if (selectedCategory) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-green-50 to-white">
        <LanguageToggle language={language} onLanguageChange={(lang) => setLanguage(lang)} />
        <div className="max-w-5xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
          <button
            onClick={() => setSelectedCategory(null)}
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-emerald-50 hover:border-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            {language === 'en' ? 'Back to all branches' : '\u0b85\u0ba9\u0bc8\u0ba4\u0bcd\u0ba4\u0bc1 \u0baa\u0bbf\u0bb0\u0bbf\u0bb5\u0bc1\u0b95\u0bb3\u0bc1\u0b95\u0bcd\u0b95\u0bc1\u0bae\u0bcd \u0ba4\u0bbf\u0bb0\u0bc1\u0bae\u0bcd\u0baa\u0bc1'}
          </button>

          <div className="mt-6 bg-white rounded-2xl p-6 md:p-8 border border-emerald-100 shadow-lg">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-emerald-100 rounded-lg text-emerald-700">
                {selectedCategory.icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {language === 'en' ? selectedCategory.titleEn : selectedCategory.titleTa}
                </h2>
                <p className="text-sm text-gray-600">
                  {language === 'en' ? selectedCategory.descriptionEn : selectedCategory.descriptionTa}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-lime-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                {language === 'en' ? 'Branch Overview' : '\u0baa\u0bbf\u0bb0\u0bbf\u0bb5\u0bc1 \u0bae\u0bc7\u0bb2\u0bcb\u0b9f\u0bcd\u0b9f\u0bae\u0bcd'}
              </p>
              <p className="mt-3 text-base leading-7 text-gray-700">
                {language === 'en'
                  ? `This branch clearly explains ${selectedDescription.toLowerCase()}. ${selectedOverview}`
                  : `${selectedDescription}. ${selectedOverview}`}
              </p>
            </div>

            {selectedTopics.length > 0 && (
              <div className="mt-5">
                <h3 className="text-sm font-semibold text-gray-900">
                  {language === 'en' ? 'This Branch Covers' : '\u0b87\u0ba8\u0bcd\u0ba4 \u0baa\u0bbf\u0bb0\u0bbf\u0bb5\u0bc1 \u0bb5\u0bbf\u0bb3\u0b95\u0bcd\u0b95\u0bc1\u0bb5\u0ba4\u0bc1'}
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedTopics.map((topic, index) => (
                    <span
                      key={`${selectedCategory.id}-topic-${index}`}
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm text-emerald-800"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-3">
                  {language === 'en' ? 'Key Things To Learn' : '\u0bae\u0bc1\u0b95\u0bcd\u0b95\u0bbf\u0baf \u0bb5\u0bbf\u0bb7\u0baf\u0b99\u0bcd\u0b95\u0bb3\u0bcd'}
                </h3>
                <p className="mb-3 text-sm text-gray-600">
                  {language === 'en'
                    ? 'Read these points to understand the main rules, procedures, and rights connected to this branch.'
                    : '\u0b87\u0ba8\u0bcd\u0ba4 \u0baa\u0bbf\u0bb0\u0bbf\u0bb5\u0bc1\u0b9f\u0ba9\u0bcd \u0ba4\u0bca\u0b9f\u0bb0\u0bcd\u0baa\u0bc1\u0b9f\u0bc8\u0baf \u0bae\u0bc1\u0b95\u0bcd\u0b95\u0bbf\u0baf \u0bb5\u0bbf\u0ba4\u0bbf\u0b95\u0bb3\u0bcd, \u0ba8\u0b9f\u0bc8\u0bae\u0bc1\u0bb1\u0bc8\u0b95\u0bb3\u0bcd, \u0b89\u0bb0\u0bbf\u0bae\u0bc8\u0b95\u0bb3\u0bc8 \u0ba4\u0bc6\u0bb3\u0bbf\u0bb5\u0bbe\u0b95 \u0baa\u0bc1\u0bb0\u0bbf\u0ba8\u0bcd\u0ba4\u0bc1\u0b95\u0bca\u0bb3\u0bcd\u0bb3 \u0b87\u0ba8\u0bcd\u0ba4 \u0baa\u0bc1\u0bb3\u0bcd\u0bb3\u0bbf\u0b95\u0bb3\u0bc8 \u0baa\u0bbe\u0bb0\u0bcd\u0b95\u0bcd\u0b95\u0bb5\u0bc1\u0bae\u0bcd.'}
                </p>
                <ul className="space-y-2 text-sm text-gray-700 list-disc pl-5">
                  {selectedLearnPoints.map((point, index) => (
                    <li key={`${selectedCategory.id}-learn-${index}`}>{point}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100">
                <h3 className="font-semibold text-gray-900 mb-3">
                  {language === 'en' ? 'Acts / Process References' : '\u0b9a\u0b9f\u0bcd\u0b9f / \u0ba8\u0b9f\u0bc8\u0bae\u0bc1\u0bb1\u0bc8 \u0b95\u0bc1\u0bb1\u0bbf\u0baa\u0bcd\u0baa\u0bc1\u0b95\u0bb3\u0bcd'}
                </h3>
                <p className="mb-3 text-sm text-emerald-800">
                  {language === 'en'
                    ? 'Use these references to understand the legal acts, filing route, or official process connected to the branch.'
                    : '\u0b87\u0ba8\u0bcd\u0ba4 \u0baa\u0bbf\u0bb0\u0bbf\u0bb5\u0bc1\u0b95\u0bcd\u0b95\u0bc1 \u0ba4\u0bca\u0b9f\u0bb0\u0bcd\u0baa\u0bc1\u0b9f\u0bc8\u0baf \u0b9a\u0b9f\u0bcd\u0b9f\u0b99\u0bcd\u0b95\u0bb3\u0bcd, \u0bae\u0ba9\u0bc1 \u0ba4\u0bbe\u0b95\u0bcd\u0b95\u0bb2\u0bcd \u0bb5\u0bb4\u0bbf, \u0b85\u0bb2\u0bcd\u0bb2\u0ba4\u0bc1 \u0b85\u0ba4\u0bbf\u0b95\u0bbe\u0bb0\u0baa\u0bcd\u0baa\u0bc2\u0bb0\u0bcd\u0bb5 \u0ba8\u0b9f\u0bc8\u0bae\u0bc1\u0bb1\u0bc8\u0baf\u0bc8 \u0baa\u0bc1\u0bb0\u0bbf\u0ba8\u0bcd\u0ba4\u0bc1\u0b95\u0bca\u0bb3\u0bcd\u0bb3 \u0b87\u0ba8\u0bcd\u0ba4 \u0b95\u0bc1\u0bb1\u0bbf\u0baa\u0bcd\u0baa\u0bc1\u0b95\u0bb3\u0bcd \u0b89\u0ba4\u0bb5\u0bc1\u0bae\u0bcd.'}
                </p>
                <ul className="space-y-2 text-sm text-gray-700 list-disc pl-5">
                  {selectedReferences.map((ref, index) => (
                    <li key={`${selectedCategory.id}-ref-${index}`}>{ref}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  setChatCategory(language === 'en' ? selectedCategory.titleEn : selectedCategory.titleTa);
                  setShowChat(true);
                }}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 px-5 py-2.5 font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:from-emerald-700 hover:to-green-700 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                <MessageSquare className="w-4 h-4" />
                {language === 'en' ? 'Go To Start Conversation' : '\u0b89\u0bb0\u0bc8\u0baf\u0bbe\u0b9f\u0bb2\u0bc8\u0ba4\u0bcd \u0ba4\u0bca\u0b9f\u0b99\u0bcd\u0b95 \u0b9a\u0bc6\u0bb2\u0bcd\u0bb2\u0bb5\u0bc1\u0bae\u0bcd'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-green-50 to-white">
      <LanguageToggle language={language} onLanguageChange={(lang) => setLanguage(lang)} />
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {language === 'en' ? 'Tamil Nadu Legal AI Assistant' : '\u0ba4\u0bae\u0bbf\u0bb4\u0bcd\u0ba8\u0bbe\u0b9f\u0bc1 \u0b9a\u0b9f\u0bcd\u0b9f AI \u0b89\u0ba4\u0bb5\u0bbf\u0baf\u0bbe\u0bb3\u0bb0\u0bcd'}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            {language === 'en' 
              ? 'Get instant guidance on Tamil Nadu laws, acts, and legal procedures. Our AI-powered assistant helps you understand your rights and legal options.'
              : '\u0ba4\u0bae\u0bbf\u0bb4\u0bcd\u0ba8\u0bbe\u0b9f\u0bc1 \u0b9a\u0b9f\u0bcd\u0b9f\u0b99\u0bcd\u0b95\u0bb3\u0bcd, \u0b9a\u0b9f\u0bcd\u0b9f\u0b99\u0bcd\u0b95\u0bb3\u0bcd \u0bae\u0bb1\u0bcd\u0bb1\u0bc1\u0bae\u0bcd \u0b9a\u0b9f\u0bcd\u0b9f \u0ba8\u0b9f\u0bc8\u0bae\u0bc1\u0bb1\u0bc8\u0b95\u0bb3\u0bcd \u0b95\u0bc1\u0bb1\u0bbf\u0ba4\u0bcd\u0ba4 \u0b89\u0b9f\u0ba9\u0b9f\u0bbf \u0bb5\u0bb4\u0bbf\u0b95\u0bbe\u0b9f\u0bcd\u0b9f\u0bb2\u0bc8\u0baa\u0bcd \u0baa\u0bc6\u0bb1\u0bc1\u0b99\u0bcd\u0b95\u0bb3\u0bcd. \u0b8e\u0b99\u0bcd\u0b95\u0bb3\u0bcd AI-\u0b86\u0bb2\u0bcd \u0b87\u0baf\u0b95\u0bcd\u0b95\u0baa\u0bcd\u0baa\u0b9f\u0bc1\u0bae\u0bcd \u0b89\u0ba4\u0bb5\u0bbf\u0baf\u0bbe\u0bb3\u0bb0\u0bcd \u0b89\u0b99\u0bcd\u0b95\u0bb3\u0bcd \u0b89\u0bb0\u0bbf\u0bae\u0bc8\u0b95\u0bb3\u0bcd \u0bae\u0bb1\u0bcd\u0bb1\u0bc1\u0bae\u0bcd \u0b9a\u0b9f\u0bcd\u0b9f \u0bb5\u0bb4\u0bbf\u0b95\u0bb3\u0bc8\u0baa\u0bcd \u0baa\u0bc1\u0bb0\u0bbf\u0ba8\u0bcd\u0ba4\u0bc1\u0b95\u0bca\u0bb3\u0bcd\u0bb3 \u0b89\u0ba4\u0bb5\u0bc1\u0b95\u0bbf\u0bb1\u0bbe\u0bb0\u0bcd.'
            }
          </p>
          
          <button
            onClick={() => {
              setChatCategory(null);
              setShowChat(true);
            }}
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-green-600 px-8 py-3 text-lg font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:from-emerald-700 hover:to-green-700 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            <MessageSquare className="w-5 h-5" />
            {language === 'en' ? 'Start Conversation' : '\u0b89\u0bb0\u0bc8\u0baf\u0bbe\u0b9f\u0bb2\u0bc8\u0ba4\u0bcd \u0ba4\u0bca\u0b9f\u0b99\u0bcd\u0b95\u0bb5\u0bc1\u0bae\u0bcd'}
          </button>
          
          <p className="mt-4 text-sm text-gray-500">
            {language === 'en' 
              ? 'Available in English and Tamil'
              : '\u0b86\u0b99\u0bcd\u0b95\u0bbf\u0bb2\u0bae\u0bcd \u0bae\u0bb1\u0bcd\u0bb1\u0bc1\u0bae\u0bcd \u0ba4\u0bae\u0bbf\u0bb4\u0bbf\u0bb2\u0bcd \u0b95\u0bbf\u0b9f\u0bc8\u0b95\u0bcd\u0b95\u0bc1\u0bae\u0bcd'
            }
          </p>
        </div>

        {/* Legal Categories Grid */}
        <div className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 text-center">
            {language === 'en' ? 'Browse 12 Legal Branches' : '12 \u0b9a\u0b9f\u0bcd\u0b9f \u0baa\u0bbf\u0bb0\u0bbf\u0bb5\u0bc1\u0b95\u0bb3\u0bc8 \u0b89\u0bb2\u0bbe\u0bb5\u0bb5\u0bc1\u0bae\u0bcd'}
          </h2>
          <p className="text-center text-gray-600 mb-8 max-w-3xl mx-auto">
            {language === 'en'
              ? 'Home screen shows short info only. Open any branch to view its full screen details.'
              : '\u0bae\u0bc1\u0b95\u0baa\u0bcd\u0baa\u0bc1 \u0ba4\u0bbf\u0bb0\u0bc8\u0baf\u0bbf\u0bb2\u0bcd \u0b9a\u0bc1\u0bb0\u0bc1\u0b95\u0bcd\u0b95\u0bae\u0bbe\u0ba9 \u0ba4\u0b95\u0bb5\u0bb2\u0bcd \u0bae\u0b9f\u0bcd\u0b9f\u0bc1\u0bae\u0bcd \u0b95\u0bbe\u0b9f\u0bcd\u0b9f\u0baa\u0bcd\u0baa\u0b9f\u0bc1\u0bae\u0bcd. \u0b8e\u0ba8\u0bcd\u0ba4 \u0baa\u0bbf\u0bb0\u0bbf\u0bb5\u0bc8\u0baf\u0bc1\u0bae\u0bcd \u0ba4\u0bbf\u0bb1\u0ba8\u0bcd\u0ba4\u0bc1 \u0b85\u0ba4\u0ba9\u0bcd \u0bae\u0bc1\u0bb4\u0bc1 \u0ba4\u0bbf\u0bb0\u0bc8 \u0bb5\u0bbf\u0bb5\u0bb0\u0b99\u0bcd\u0b95\u0bb3\u0bc8\u0baa\u0bcd \u0baa\u0bbe\u0bb0\u0bc1\u0b99\u0bcd\u0b95\u0bb3\u0bcd.'
            }
          </p>
          <div className="mb-4 text-center">
            {isStudyLoading && (
              <p className="text-sm text-emerald-700">
                {language === 'en'
                  ? 'Loading branch study details from legal database...'
                  : '\u0b9a\u0b9f\u0bcd\u0b9f \u0ba4\u0bb0\u0bb5\u0bc1\u0ba4\u0bcd\u0ba4\u0bb3\u0ba4\u0bcd\u0ba4\u0bbf\u0bb2\u0bbf\u0bb0\u0bc1\u0ba8\u0bcd\u0ba4\u0bc1 \u0baa\u0bbf\u0bb0\u0bbf\u0bb5\u0bc1 \u0baa\u0b9f\u0bbf\u0baa\u0bcd\u0baa\u0bc1\u0ba4\u0bcd \u0ba4\u0b95\u0bb5\u0bb2\u0bcd \u0b8f\u0bb1\u0bcd\u0bb1\u0baa\u0bcd\u0baa\u0b9f\u0bc1\u0b95\u0bbf\u0bb1\u0ba4\u0bc1...'}
              </p>
            )}
            {!isStudyLoading && studyError && (
              <p className="text-sm text-amber-700">
                {language === 'en'
                  ? 'Live DB details unavailable right now. Showing fallback notes.'
                  : '\u0ba4\u0bb1\u0bcd\u0baa\u0bcb\u0ba4\u0bc1 \u0ba8\u0bc7\u0bb0\u0b9f\u0bbf \u0ba4\u0bb0\u0bb5\u0bc1\u0ba4\u0bcd\u0ba4\u0bb3 \u0ba4\u0b95\u0bb5\u0bb2\u0bcd \u0b95\u0bbf\u0b9f\u0bc8\u0b95\u0bcd\u0b95\u0bb5\u0bbf\u0bb2\u0bcd\u0bb2\u0bc8. \u0bae\u0bbe\u0bb1\u0bcd\u0bb1\u0bc1 \u0b95\u0bc1\u0bb1\u0bbf\u0baa\u0bcd\u0baa\u0bc1\u0b95\u0bb3\u0bcd \u0b95\u0bbe\u0b9f\u0bcd\u0b9f\u0baa\u0bcd\u0baa\u0b9f\u0bc1\u0b95\u0bbf\u0ba9\u0bcd\u0bb1\u0ba9.'}
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {legalCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className="group w-full text-left rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-emerald-100 rounded-lg text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    {category.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-2">
                      {language === 'en' ? category.titleEn : category.titleTa}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {language === 'en' ? category.descriptionEn : category.descriptionTa}
                    </p>
                    <p className="mt-3 text-xs font-semibold text-emerald-700">
                      {language === 'en' ? 'Open branch screen' : '\u0baa\u0bbf\u0bb0\u0bbf\u0bb5\u0bc1 \u0ba4\u0bbf\u0bb0\u0bc8\u0baf\u0bc8\u0ba4\u0bcd \u0ba4\u0bbf\u0bb1'}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Features Section */}
        {/* <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">
            {language === 'en' ? 'How It Works' : 'à®‡à®¤à¯ à®Žà®ªà¯à®ªà®Ÿà®¿ à®µà¯‡à®²à¯ˆ à®šà¯†à®¯à¯à®•à®¿à®±à®¤à¯'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-full mb-4">
                <span className="font-bold text-xl">1</span>
              </div>
              <h3 className="font-bold text-lg mb-2">
                {language === 'en' ? 'Describe Your Situation' : 'à®‰à®™à¯à®•à®³à¯ à®¨à®¿à®²à¯ˆà®®à¯ˆà®¯à¯ˆ à®µà®¿à®µà®°à®¿à®•à¯à®•à®µà¯à®®à¯'}
              </h3>
              <p className="text-gray-600">
                {language === 'en' 
                  ? 'Explain your legal issue in simple words'
                  : 'à®‰à®™à¯à®•à®³à¯ à®šà®Ÿà¯à®Ÿà®ªà¯ à®ªà®¿à®°à®šà¯à®šà®©à¯ˆà®¯à¯ˆ à®Žà®³à®¿à®¯ à®šà¯Šà®±à¯à®•à®³à®¿à®²à¯ à®µà®¿à®³à®•à¯à®•à¯à®™à¯à®•à®³à¯'
                }
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full mb-4">
                <span className="font-bold text-xl">2</span>
              </div>
              <h3 className="font-bold text-lg mb-2">
                {language === 'en' ? 'AI Analysis' : 'AI à®ªà®•à¯à®ªà¯à®ªà®¾à®¯à¯à®µà¯'}
              </h3>
              <p className="text-gray-600">
                {language === 'en' 
                  ? 'Our AI searches relevant Tamil Nadu laws and judgments'
                  : 'à®Žà®™à¯à®•à®³à¯ AI à®¤à¯Šà®Ÿà®°à¯à®ªà¯à®Ÿà¯ˆà®¯ à®¤à®®à®¿à®´à¯à®¨à®¾à®Ÿà¯ à®šà®Ÿà¯à®Ÿà®™à¯à®•à®³à¯ à®®à®±à¯à®±à¯à®®à¯ à®¤à¯€à®°à¯à®ªà¯à®ªà¯à®•à®³à¯ˆà®¤à¯ à®¤à¯‡à®Ÿà¯à®•à®¿à®±à®¤à¯'
                }
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-lime-100 text-lime-700 rounded-full mb-4">
                <span className="font-bold text-xl">3</span>
              </div>
              <h3 className="font-bold text-lg mb-2">
                {language === 'en' ? 'Get Guidance' : 'à®µà®´à®¿à®•à®¾à®Ÿà¯à®Ÿà®²à¯ˆà®ªà¯ à®ªà¯†à®±à¯à®™à¯à®•à®³à¯'}
              </h3>
              <p className="text-gray-600">
                {language === 'en' 
                  ? 'Receive step-by-step guidance and legal references'
                  : 'à®ªà®Ÿà®¿à®ªà¯à®ªà®Ÿà®¿à®¯à®¾à®© à®µà®´à®¿à®•à®¾à®Ÿà¯à®Ÿà®²à¯ à®®à®±à¯à®±à¯à®®à¯ à®šà®Ÿà¯à®Ÿ à®•à¯à®±à®¿à®ªà¯à®ªà¯à®•à®³à¯ˆà®ªà¯ à®ªà¯†à®±à¯à®™à¯à®•à®³à¯'
                }
              </p>
            </div>
          </div>
        </div> */}

        {/* Disclaimer */}
        {/* <div className="mt-12 p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-sm text-yellow-800 text-center">
            âš–ï¸ {language === 'en' 
              ? 'Disclaimer: This AI assistant provides legal information based on Tamil Nadu laws. It is not a substitute for professional legal advice. Always consult a qualified lawyer for your specific situation.'
              : 'à®®à®±à¯à®ªà¯à®ªà¯: à®‡à®¨à¯à®¤ AI à®‰à®¤à®µà®¿à®¯à®¾à®³à®°à¯ à®¤à®®à®¿à®´à¯à®¨à®¾à®Ÿà¯ à®šà®Ÿà¯à®Ÿà®™à¯à®•à®³à¯ˆ à®…à®Ÿà®¿à®ªà¯à®ªà®Ÿà¯ˆà®¯à®¾à®•à®•à¯ à®•à¯Šà®£à¯à®Ÿ à®šà®Ÿà¯à®Ÿ à®¤à®•à®µà®²à¯à®•à®³à¯ˆ à®µà®´à®™à¯à®•à¯à®•à®¿à®±à®¤à¯. à®‡à®¤à¯ à®¤à¯Šà®´à®¿à®²à¯à®®à¯à®±à¯ˆ à®šà®Ÿà¯à®Ÿ à®†à®²à¯‹à®šà®©à¯ˆà®•à¯à®•à¯ à®®à®¾à®±à¯à®±à®¾à®• à®‡à®²à¯à®²à¯ˆ. à®‰à®™à¯à®•à®³à¯ à®•à¯à®±à®¿à®ªà¯à®ªà®¿à®Ÿà¯à®Ÿ à®šà¯‚à®´à¯à®¨à®¿à®²à¯ˆà®•à¯à®•à¯ à®¤à®•à¯à®¤à®¿à®µà®¾à®¯à¯à®¨à¯à®¤ à®µà®´à®•à¯à®•à®±à®¿à®žà®°à¯ˆ à®Žà®ªà¯à®ªà¯‹à®¤à¯à®®à¯ à®•à®²à®¨à¯à®¤à®¾à®²à¯‹à®šà®¿à®•à¯à®•à®µà¯à®®à¯.'
            }
          </p>
        </div> */}
      </div>
    </div>
  );
}

