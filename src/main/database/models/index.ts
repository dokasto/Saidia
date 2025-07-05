import { Subject } from './Subject';
import { File } from './File';
import { Question } from './Question';
import { Tag } from './Tag';
import { QuestionTag } from './QuestionTag';

// Define associations
Subject.hasMany(File, { foreignKey: 'subject_id', as: 'files' });
File.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject' });

Subject.hasMany(Question, { foreignKey: 'subject_id', as: 'questions' });
Question.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject' });

// Many-to-many relationship between Questions and Tags
Question.belongsToMany(Tag, {
  through: QuestionTag,
  foreignKey: 'question_id',
  otherKey: 'tag_id',
  as: 'tags',
});

Tag.belongsToMany(Question, {
  through: QuestionTag,
  foreignKey: 'tag_id',
  otherKey: 'question_id',
  as: 'questions',
});

export { Subject, File, Question, Tag, QuestionTag };
