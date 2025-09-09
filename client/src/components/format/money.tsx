function FormatMoney({ amount }: { amount: number }) {
  return <span>${amount.toFixed(2)}</span>;
}

export default FormatMoney;
