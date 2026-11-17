/**
 * Tenant Isolation Mongoose Plugin
 * Injects hospitalId filtering into find, findOne, countDocuments, update, etc.,
 * whenever an execution context specifies a tenant hospitalId.
 */
module.exports = function tenantPlugin(schema) {
  schema.add({
    hospitalId: {
      type: require('mongoose').Schema.Types.ObjectId,
      ref: 'Hospital',
      index: true
    }
  });

  const queryOps = [
    'find',
    'findOne',
    'findOneAndUpdate',
    'update',
    'updateMany',
    'updateOne',
    'countDocuments'
  ];

  queryOps.forEach((op) => {
    schema.pre(op, function () {
      const options = this.getOptions();
      // If a tenantContext is passed in options or query filter
      if (options && options.tenantHospitalId) {
        this.where({ hospitalId: options.tenantHospitalId });
      }
    });
  });
};
