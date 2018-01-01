
function format(uuid) {
  '00000086-0000-1000-8000-0026BB765291'

  return uuid.replace(/([0-9a-fA-F]{8})([0-9a-fA-F]{4})([0-9a-fA-F]{4})([0-9a-fA-F]{4})([0-9a-fA-F]{12})/, '$1-$2-$3-$4-$5').toUpperCase();
}

module.exports = {
  format: format
};