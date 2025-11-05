// server/db.cjs — in-memory demo DB
const customers = [
  // ví dụ sẵn để test
  { id: 1, phone: "0912345678", name: "Nguyễn A", points: 350 }
];

const txs = []; // {time, kind: 'earn'|'redeem', phone, name, points, amountVND, invoiceCode, staff, note}

let _id = customers.length + 1;
function upsertCustomerByPhone(phone, nameIfNew = "") {
  let c = customers.find(x => x.phone === phone);
  if (!c) {
    c = { id: _id++, phone, name: nameIfNew || `Khách ${phone}`, points: 0 };
    customers.push(c);
  } else if (nameIfNew && !c.name) {
    c.name = nameIfNew;
  }
  return c;
}

module.exports = { customers, txs, upsertCustomerByPhone };
