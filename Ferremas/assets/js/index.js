async function proxyApi(){
    fetch("http://localhost:3000/api/dolar")
  .then(res => res.json())
  .then(data => {
    dolar = data.valorDolar
    //modificar esa linea para agregar el elemento que mostrara el dato en index o cualquier pagina donde se llame
    document.querySelector('.dolaruco').innerHTML = dolar
    console.log(dolar)
  });
}

proxyApi()