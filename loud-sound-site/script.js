const pkg=document.querySelector('#package'),hours=document.querySelector('#hours'),dj=document.querySelector('#dj'),delivery=document.querySelector('#delivery'),total=document.querySelector('#total');function calc(){let h=Math.max(4,Number(hours.value)||4);hours.value=h;let n=(Number(pkg.value)+(dj.checked?50:0))*h+(delivery.checked?75:0);total.textContent='$'+n.toLocaleString()}[pkg,hours,dj,delivery].forEach(x=>x.addEventListener('change',calc));document.querySelectorAll('[data-package]').forEach(b=>b.addEventListener('click',()=>{pkg.value=b.dataset.package;calc();document.querySelector('#quote').scrollIntoView()}));document.querySelector('#quoteForm').addEventListener('submit',e=>{e.preventDefault();let name=document.querySelector('#name').value,date=document.querySelector('#date').value,loc=document.querySelector('#location').value;let msg=`Hi LOUD SOUND! My name is ${name}. I'm interested in the ${pkg.options[pkg.selectedIndex].text}. Hours: ${hours.value}. DJ: ${dj.checked?'Yes':'No'}. Delivery/setup: ${delivery.checked?'Yes':'No'}. Estimated total: ${total.textContent}. Event date: ${date||'TBD'}. Location: ${loc||'TBD'}.`;location.href='sms:+19565311913?&body='+encodeURIComponent(msg)});calc();
// Stripe production redeploy
async function startStripeCheckout() {
  const packageId = pkg.value;
  const eventHours = Number(hours.value);
  const addDJ = dj.checked;
  const addDelivery = delivery.checked;

  if (!packageId) {
    alert("Please select a package.");
    return;
  }

  if (!Number.isInteger(eventHours) || eventHours < 4) {
    alert("A minimum of 4 hours is required.");
    return;
  }

  try {
    const response = await fetch("/api/create-checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        packageId: packageId,
        hours: eventHours,
        dj: addDJ,
        delivery: addDelivery
      })
    });

    const data = await response.json();

    if (!response.ok || !data.url) {
      throw new Error(data.error || "Unable to start checkout.");
    }

    window.location.href = data.url;
  } catch (error) {
    console.error(error);
    alert("Unable to start payment. Please try again.");
  }
}

window.startStripeCheckout = startStripeCheckout;
