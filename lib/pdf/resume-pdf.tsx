'use client'
// This file renders the resume as a PDF using @react-pdf/renderer
// It mirrors the LaTeX layout for visual consistency

import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
  Font,
} from '@react-pdf/renderer'
import type { ResumeData } from '@/types'

const PURPLE = '#7C3AED'
const DARK = '#111827'
const MID = '#374151'
const LIGHT = '#6B7280'

function makeStyles(data: ResumeData) {
  const fs = data.fontSizePt
  const tight = data.compact
  return StyleSheet.create({
    page: {
      fontFamily: 'Helvetica',
      fontSize: fs,
      paddingTop: tight ? 28 : 36,
      paddingBottom: tight ? 28 : 36,
      paddingLeft: tight ? 36 : 42,
      paddingRight: tight ? 36 : 42,
      color: DARK,
      lineHeight: 1.35,
    },
    header: { textAlign: 'center', marginBottom: 8 },
    name: { fontSize: fs + 8, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
    contactLine: { fontSize: fs - 0.5, color: LIGHT },
    section: { marginTop: tight ? 6 : 8, marginBottom: 2 },
    sectionTitle: {
      fontSize: fs + 0.5,
      fontFamily: 'Helvetica-Bold',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      borderBottomWidth: 0.8,
      borderBottomColor: PURPLE,
      paddingBottom: 1,
      marginBottom: tight ? 3 : 5,
      color: PURPLE,
    },
    summary: { fontSize: fs - 0.5, color: MID, lineHeight: 1.5 },
    skillRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: tight ? 1 : 2,
    },
    skillLabel: { fontFamily: 'Helvetica-Bold', fontSize: fs - 1 },
    skillValue: { fontSize: fs - 1, color: MID },
    expHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: tight ? 4 : 6,
      marginBottom: 1,
    },
    expTitle: { fontFamily: 'Helvetica-Bold', fontSize: fs },
    expPeriod: { fontSize: fs - 1, color: LIGHT },
    expCompany: { fontSize: fs - 0.5, color: MID, fontFamily: 'Helvetica-Oblique', marginBottom: 2 },
    bullet: { flexDirection: 'row', marginBottom: tight ? 0.5 : 1 },
    bulletDot: { width: 10, fontSize: fs - 1, color: PURPLE },
    bulletText: { flex: 1, fontSize: fs - 1, color: MID, lineHeight: 1.4 },
    eduRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
    eduDegree: { fontFamily: 'Helvetica-Bold', fontSize: fs - 0.5 },
    eduYear: { fontSize: fs - 1, color: LIGHT },
    eduInst: { fontSize: fs - 1, color: MID },
    certsText: { fontSize: fs - 1, color: MID },
  })
}

export function ResumePDF({ data }: { data: ResumeData }) {
  const styles = makeStyles(data)
  const maxBullets = data.compact ? 2 : 4

  const contactParts: string[] = []
  if (data.phone) contactParts.push(data.phone)
  if (data.email) contactParts.push(data.email)
  if (data.location) contactParts.push(data.location)
  if (data.linkedin) contactParts.push('LinkedIn')
  if (data.portfolio || data.website) contactParts.push('Portfolio')

  const sortedExp = [...data.experiences].sort(
    (a, b) => b.relevanceScore - a.relevanceScore
  )

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{data.name}</Text>
          <Text style={styles.contactLine}>{contactParts.join('  ·  ')}</Text>
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Professional Summary</Text>
          <Text style={styles.summary}>{data.summary}</Text>
        </View>

        {/* Skills */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          {data.skills.map((g, i) => (
            <View key={i} style={styles.skillRow}>
              <Text style={styles.skillLabel}>{g.category}: </Text>
              <Text style={styles.skillValue}>{g.items.join(', ')}</Text>
            </View>
          ))}
        </View>

        {/* Experience */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experience</Text>
          {sortedExp.map((exp, i) => (
            <View key={i}>
              <View style={styles.expHeader}>
                <Text style={styles.expTitle}>{exp.title}</Text>
                <Text style={styles.expPeriod}>{exp.period}</Text>
              </View>
              <Text style={styles.expCompany}>
                {exp.company}
                {exp.location ? ` — ${exp.location}` : ''}
              </Text>
              {exp.bullets.slice(0, maxBullets).map((b, j) => (
                <View key={j} style={styles.bullet}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{b}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Education */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Education</Text>
          {data.education.map((edu, i) => (
            <View key={i}>
              <View style={styles.eduRow}>
                <Text style={styles.eduDegree}>{edu.degree}</Text>
                {edu.year && <Text style={styles.eduYear}>{edu.year}</Text>}
              </View>
              <Text style={styles.eduInst}>
                {edu.institution}
                {edu.location ? `, ${edu.location}` : ''}
              </Text>
            </View>
          ))}
        </View>

        {/* Certifications */}
        {data.certifications && data.certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            <Text style={styles.certsText}>
              {data.certifications.join('  ·  ')}
            </Text>
          </View>
        )}
      </Page>
    </Document>
  )
}
