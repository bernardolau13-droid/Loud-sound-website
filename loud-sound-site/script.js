const pkg = document.querySelector('#package');
const hours = document.querySelector('#hours');
const dj = document.querySelector('#dj');
const delivery = document.querySelector('#delivery');
const total = document.querySelector('#total');

const PACKAGE_RATES = {
  small: 75,
  party: 110,
  pro: 140,
  full: 175
};

function calc() {
  const h = Math.max(4, Number(hours.value) || 4);
  hours.value = h;

  const rate = PACKAGE_RATES[pkg.value] || 0;
  const djRate = dj.checked ? 50 : 0;
  const deliveryFee = delivery.checked ? 75 : 0;

  const n = (rate + djRate) * h + deliveryFee;

  total.textContent = '$' + n.toLocaleString();
}

[pkg, hours, dj, delivery].forEach((element) => {
  element.addEventListener('change', calc);
});

document.querySelectorAll('[data-package]').forEach((button) => {
  button.addEventListener('click', () => {
    const packageMap = {
      75: 'small',
      110: 'party',
      140: 'pro',
      175: 'full'
    };

    pkg.value = packageMap[button.dataset.package] || button.dataset.package;

    calc();
    document.querySelector('#quote').scrollIntoView({
      behavior: 'smooth'
    });
  });
});

document.querySelector('#quoteForm').addEventListener('submit', (e) => {
  e.preventDefault();

  const name = document.querySelector('#name').value;
  const date = document.querySelector('#date').value;
  const loc = document.querySelector('#location').value;

  const msg =
    `Hi LOUD SOUND! My name is ${name}. ` +
    `I'm interested in the ${pkg.options[pkg.selectedIndex].text}. ` +
    `Hours: ${hours.value}. ` +
    `DJ: ${dj.checked ? 'Yes' : 'No'}. ` +
    `Delivery/setup: ${delivery.checked ? 'Yes' : 'No'}. ` +
    `Estimated total: ${total.textContent}. ` +
    `Event date: ${date || 'TBD'}. ` +
    `Location: ${loc || 'TBD'}.`;

  location.href =
    'sms:+19565311913?&body=' + encodeURIComponent(msg);
});

async function startStripeCheckout() {
  const packageId = pkg.value;
  const eventHours = Number(hours.value);
  const addDJ = dj.checked;
  const addDelivery = delivery.checked;

  const eventDate = document.querySelector('#date').value;
  const venue = document.querySelector('#location').value;

  if (!PACKAGE_RATES[packageId]) {
    alert('Please select a valid package.');
    return;
  }

  if (!Number.isInteger(eventHours) || eventHours < 4) {
    alert('A minimum of 4 hours is required.');
    return;
  }

  try {
    const response = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        packageId: packageId,
        hours: eventHours,
        dj: addDJ,
        delivery: addDelivery,
        eventDate: eventDate,
        venue: venue
      })
    });

    const data = await response.json();

    if (!response.ok || !data.url) {
      throw new Error(
        data.error || 'Unable to start checkout.'
      );
    }

    window.location.href = data.url;
  } catch (error) {
    console.error(error);
    alert('Unable to start payment. Please try again.');
  }
}

window.startStripeCheckout = startStripeCheckout;

calc();
