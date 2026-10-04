import {
  isClosedEarly,
  isReached,
  isValidAmount,
  overshoot,
  progressAfterEdit,
  progressFraction,
  remaining,
  sumAmounts,
} from './progress';

describe('sumAmounts', () => {
  it('складывает записи', () => {
    expect(sumAmounts([{ amount: 10 }, { amount: 30 }, { amount: 120 }])).toBe(160);
  });

  it('пустая история — ноль, а не NaN', () => {
    expect(sumAmounts([])).toBe(0);
  });

});

describe('progressAfterEdit', () => {
  it('правка дня вниз: было не 200, а 150', () => {
    // прогресс 500, из них 200 за правимый день → станет 450
    expect(progressAfterEdit(500, 200, 150)).toBe(450);
  });

  it('правка вверх', () => {
    expect(progressAfterEdit(500, 200, 260)).toBe(560);
  });

  it('обнуление дня убирает его вклад целиком', () => {
    expect(progressAfterEdit(500, 200, 0)).toBe(300);
  });

  it('правка в то же значение ничего не меняет', () => {
    expect(progressAfterEdit(500, 200, 200)).toBe(500);
  });
});

describe('isValidAmount', () => {
  it('обычное значение', () => {
    expect(isValidAmount(150)).toBe(true);
  });

  it('ноль допустим — так убирают день, которого не было', () => {
    expect(isValidAmount(0)).toBe(true);
  });

  it('отрицательное нельзя: сделать минус невозможно', () => {
    expect(isValidAmount(-50)).toBe(false);
  });

  it('дробное нельзя', () => {
    expect(isValidAmount(1.5)).toBe(false);
  });

  it('NaN нельзя — это пустое поле ввода', () => {
    expect(isValidAmount(Number.NaN)).toBe(false);
  });
});

describe('remaining', () => {
  it('обычный случай', () => {
    expect(remaining(120, 1000)).toBe(880);
  });

  it('цель достигнута — ноль', () => {
    expect(remaining(1000, 1000)).toBe(0);
  });

  it('перевыполнено — ноль, а не отрицательное число', () => {
    expect(remaining(1010, 1000)).toBe(0);
  });

});


describe('isReached', () => {
  it('ровно цель — достигнута', () => {
    expect(isReached(1000, 1000)).toBe(true);
  });

  it('на единицу меньше — нет', () => {
    expect(isReached(999, 1000)).toBe(false);
  });

  it('перевыполнение — достигнута', () => {
    expect(isReached(1010, 1000)).toBe(true);
  });
});

describe('overshoot', () => {
  it('считает перевыполнение', () => {
    expect(overshoot(1010, 1000)).toBe(10);
  });

  it('ровно цель — нет перевыполнения', () => {
    expect(overshoot(1000, 1000)).toBe(0);
  });

  it('недобор — ноль, а не отрицательное', () => {
    expect(overshoot(500, 1000)).toBe(0);
  });
});

describe('progressFraction', () => {
  it('половина', () => {
    expect(progressFraction(500, 1000)).toBe(0.5);
  });

  it('цель 0 не делит на ноль', () => {
    expect(progressFraction(0, 0)).toBe(1);
  });

  it('отрицательная цель не ломает кольцо', () => {
    expect(progressFraction(10, -5)).toBe(1);
  });

  it('перевыполнение не переполняет кольцо', () => {
    expect(progressFraction(2000, 1000)).toBe(1);
  });

});

describe('isClosedEarly', () => {
  it('до цели не дошли — досрочно', () => {
    expect(isClosedEarly(300, 1000)).toBe(true);
  });

  it('ровно цель — не досрочно', () => {
    expect(isClosedEarly(1000, 1000)).toBe(false);
  });

  it('перевыполнено — тем более не досрочно', () => {
    expect(isClosedEarly(1040, 1000)).toBe(false);
  });

  it('пустая цель — досрочно', () => {
    expect(isClosedEarly(0, 1000)).toBe(true);
  });
});
