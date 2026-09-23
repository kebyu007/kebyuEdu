import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma.service';
import { CreateExamDto } from './dto/create-exam.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ExamsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createExamDto: CreateExamDto, file?: Express.Multer.File) {
    const group = await this.prisma.group.findUnique({
      where: { id: parseInt(createExamDto.group_id) },
    });
    if (!group) throw new NotFoundException('Guruh topilmadi!');

    const hours = parseInt(createExamDto.deadline_hours || '24');
    const deadlineDate = new Date();
    deadlineDate.setHours(deadlineDate.getHours() + hours);

    let fileUrl: string | null = null;
    if (file) {
      fileUrl = `/uploads/exams/${file.filename}`;
    }

    return await this.prisma.exam.create({
      data: {
        group_id: parseInt(createExamDto.group_id),
        topic: createExamDto.topic,
        description: createExamDto.description,
        file: fileUrl,
        minScore: parseInt(createExamDto.minScore),
        maxScore: parseInt(createExamDto.maxScore),
        status: 'Kutilmoqda',
        date: deadlineDate,
      },
    });
  }

  async getExam(id: number) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: {
        group: {
          include: {
            studentGroups: {
              include: { student: true }
            }
          }
        },
        examResults: {
          include: { student: true }
        }
      }
    });
    if (!exam) throw new NotFoundException('Imtihon topilmadi!');

    const groupStudents = exam.group.studentGroups.map((sg) => sg.student);
    const answers = exam.examResults;

    const notSubmitted: any[] = [];
    const pending: any[] = [];
    const checked: any[] = [];
    const rejected: any[] = [];

    groupStudents.forEach((student) => {
      const answer = answers.find((a) => a.student_id === student.id);

      const studentData = {
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        avatar: student.photo,
        submitDate: answer ? answer.createdAt : null,
        status: answer ? answer.status : 'NOT_SUBMITTED',
        answerId: answer ? answer.id : null,
        file: answer ? answer.answer_file : null,
        title: answer ? answer.answer_text : null,
        grade: answer ? answer.score : null,
      };

      if (!answer) {
        notSubmitted.push(studentData);
      } else if (answer.status === 'PENDING') {
        pending.push(studentData);
      } else if (answer.status === 'CHECKED') {
        checked.push(studentData);
      } else if (answer.status === 'REJECTED') {
        rejected.push(studentData);
      }
    });

    return {
      id: exam.id,
      title: exam.topic,
      description: exam.description,
      dueDate: exam.date,
      file: exam.file,
      maxScore: exam.maxScore,
      results: {
        notSubmitted,
        pending,
        checked,
        rejected,
      },
      stats: {
        notSubmitted: notSubmitted.length,
        pending: pending.length,
        checked: checked.length,
        rejected: rejected.length,
      },
    };
  }

  async submitAnswer(
    user: any,
    examId: number,
    dto: import('./dto/submit-exam-answer.dto').SubmitExamAnswerDto,
    file?: Express.Multer.File,
  ) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException('Imtihon topilmadi!');

    let fileUrl: string | null = null;
    if (file) {
      fileUrl = `/uploads/exams/${file.filename}`;
    }

    return await this.prisma.examResult.upsert({
      where: {
        exam_id_student_id: {
          exam_id: examId,
          student_id: user.id,
        },
      },
      update: {
        answer_text: dto.answer_text,
        answer_file: fileUrl,
        status: 'PENDING',
      },
      create: {
        exam_id: examId,
        student_id: user.id,
        answer_text: dto.answer_text,
        answer_file: fileUrl,
        status: 'PENDING',
      },
    });
  }

  async gradeAnswer(resultId: number, dto: import('./dto/grade-exam.dto').GradeExamDto) {
    const result = await this.prisma.examResult.findUnique({
      where: { id: resultId },
      include: { exam: true },
    });
    if (!result) throw new NotFoundException('Javob topilmadi!');

    if (dto.score > result.exam.maxScore) {
      dto.score = result.exam.maxScore;
    }

    const passed = dto.score >= result.exam.minScore;

    return await this.prisma.examResult.update({
      where: { id: resultId },
      data: {
        score: dto.score,
        passed,
        status: 'CHECKED',
      },
    });
  }

  async deleteExam(id: number) {
    const exam = await this.prisma.exam.findUnique({ where: { id } });
    if (!exam) throw new NotFoundException('Imtihon topilmadi!');

    // First delete all results associated with the exam due to foreign keys, unless onDelete: Cascade is set.
    // In schema, ExamResult has exam_id Int, and relations might not have cascade.
    await this.prisma.examResult.deleteMany({
      where: { exam_id: id }
    });

    return await this.prisma.exam.delete({
      where: { id }
    });
  }
}
