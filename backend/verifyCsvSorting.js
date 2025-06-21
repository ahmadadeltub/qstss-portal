#!/usr/bin/env node

/**
 * CSV SORTING VERIFICATION SCRIPT
 * 
 * This script verifies that students are sorted according to the CSV file order
 * and provides a comprehensive test of the sorting functionality.
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Student = require('./models/Student');

console.log('🏫 Qatar Science and Technology Secondary School');
console.log('📋 CSV Sorting Verification Test');
console.log('===============================');

async function verifyCsvSorting() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/teacher-portal');
    console.log('✅ Connected successfully');

    // Read CSV file
    const csvPath = path.join(__dirname, 'students.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const csvLines = csvContent.split('\n').filter(line => line.trim());
    const csvData = csvLines.slice(1).map(line => {
      const columns = line.split(/[,\t]/).map(col => col.replace(/"/g, '').trim());
      return {
        studentId: columns[0],
        name: columns[1],
        grade: columns[2],
        class: columns[3]
      };
    }).filter(row => row.studentId && row.name);

    console.log(`📄 CSV contains ${csvData.length} students`);

    // Get students from database
    const dbStudents = await Student.find({}).sort({ _id: 1 }); // Sort by insertion order
    console.log(`💾 Database contains ${dbStudents.length} students`);

    // Verify count matches
    if (csvData.length !== dbStudents.length) {
      console.log(`❌ Count mismatch: CSV has ${csvData.length}, DB has ${dbStudents.length}`);
      return false;
    }

    console.log('\n🔍 Verifying order matches CSV file...');
    
    let matches = 0;
    let mismatches = [];

    for (let i = 0; i < Math.min(csvData.length, dbStudents.length); i++) {
      const csvStudent = csvData[i];
      const dbStudent = dbStudents[i];

      if (csvStudent.studentId === dbStudent.studentId && 
          csvStudent.name === `${dbStudent.firstName} ${dbStudent.lastName}` &&
          csvStudent.grade === dbStudent.grade &&
          csvStudent.class === dbStudent.class) {
        matches++;
      } else {
        mismatches.push({
          position: i + 1,
          csv: csvStudent,
          db: {
            studentId: dbStudent.studentId,
            name: `${dbStudent.firstName} ${dbStudent.lastName}`,
            grade: dbStudent.grade,
            class: dbStudent.class
          }
        });
      }
    }

    console.log(`✅ Perfect matches: ${matches}/${csvData.length}`);
    
    if (mismatches.length === 0) {
      console.log('🎉 PERFECT MATCH! Students are in exact CSV order!');
      
      // Show sample verification
      console.log('\n📋 Sample verification (first 10 students):');
      for (let i = 0; i < Math.min(10, dbStudents.length); i++) {
        const student = dbStudents[i];
        console.log(`   ${i + 1}. ${student.firstName} ${student.lastName} (${student.studentId}) - Grade ${student.grade}, Class ${student.class}`);
      }

      console.log('\n📋 Sample verification (last 5 students):');
      for (let i = Math.max(0, dbStudents.length - 5); i < dbStudents.length; i++) {
        const student = dbStudents[i];
        console.log(`   ${i + 1}. ${student.firstName} ${student.lastName} (${student.studentId}) - Grade ${student.grade}, Class ${student.class}`);
      }

      // Grade distribution verification
      console.log('\n📊 Grade Distribution:');
      const gradeDistribution = await Student.aggregate([
        { $group: { _id: '$grade', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);

      gradeDistribution.forEach(grade => {
        console.log(`   Grade ${grade._id}: ${grade.count} students`);
      });

      console.log('\n🌟 CSV SORTING VERIFICATION SUCCESSFUL!');
      console.log('=====================================');
      console.log('✅ All students are sorted according to CSV file order');
      console.log('✅ Student data integrity verified');
      console.log('✅ Grade distribution confirmed');
      console.log('✅ System ready for production use');
      
      return true;
    } else {
      console.log(`❌ Found ${mismatches.length} mismatches:`);
      mismatches.slice(0, 5).forEach(mismatch => {
        console.log(`   Position ${mismatch.position}:`);
        console.log(`     CSV: ${mismatch.csv.studentId} - ${mismatch.csv.name}`);
        console.log(`     DB:  ${mismatch.db.studentId} - ${mismatch.db.name}`);
      });
      return false;
    }

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  } finally {
    console.log('\n🔌 Closing database connection...');
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
}

// Run verification
console.log('🚀 Starting CSV sorting verification...');
verifyCsvSorting().then(success => {
  if (success) {
    console.log('\n🎯 RESULT: CSV sorting verification PASSED');
    process.exit(0);
  } else {
    console.log('\n💥 RESULT: CSV sorting verification FAILED');
    process.exit(1);
  }
});
