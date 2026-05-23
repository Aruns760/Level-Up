const { z } = require("zod");

const createJobSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  location: z.string().min(2),
  salary: z.string().min(2),
});

module.exports = { createJobSchema };