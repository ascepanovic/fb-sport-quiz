
//we are going to store all our models here, or we do them separatley

module.exports = function(mongoose) {

  var Schema = mongoose.Schema;

  //our questions schema:
  var questionsSchema = Schema({
    title: String,
    answer: String
  })
  // declare seat covers here too
  var models = {
    Question : mongoose.model('Question', questionsSchema)
  };

  return models;
}
