import { Subject } from './Subject';
import { File } from './File';
import { Question } from './Question';
import { Embedding } from './Embedding';

Subject.hasMany(File, { foreignKey: 'subject_id', as: 'files' });
File.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject' });

Subject.hasMany(Question, { foreignKey: 'subject_id', as: 'questions' });
Question.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject' });

export { Subject, File, Question, Embedding };
