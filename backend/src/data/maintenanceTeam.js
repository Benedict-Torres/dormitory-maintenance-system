 // Sample maintenance employees and the categories they are qualified to handle.
 // Replace these example records with your dormitory's actual maintenance team.
const maintenanceTeam = [
  {
    id: "employee-001",
    name: "Sample Employee 1",
    role: "Plumbing Technician",
    categories: ["Plumbing"],
  },
  {
    id: "employee-002",
    name: "Sample Employee 2",
    role: "Electrical Technician",
    categories: ["Electrical"],
  },
  {
    id: "employee-003",
    name: "Sample Employee 3",
    role: "Carpentry Technician",
    categories: ["Carpentry"],
  },
  {
    id: "employee-004",
    name: "Sample Employee 4",
    role: "Cleaning Staff",
    categories: ["Cleaning"],
  },
  {
    id: "employee-005",
    name: "Sample Employee 5",
    role: "General Maintenance Staff",
    categories: ["Plumbing", "Electrical", "Carpentry", "Cleaning", "Other"],
  },
];

module.exports = maintenanceTeam;
