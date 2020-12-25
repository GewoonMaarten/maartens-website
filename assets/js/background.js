import { SVG } from '@svgdotjs/svg.js'

const background_ele = document.getElementById('background')
const svg = SVG().addTo(background_ele).size('100%', '100%')
// values derived through experimentation
const density_multiplier = 0.01 

/**
 * Generates a random number between `min` and `max`
 * @param {number} min 
 * @param {number} max 
 */
const getRandomNumber = (min, max) => 
{
  return Math.floor(Math.random() * (max - min) + min)
}

/**
 * Generates a random position on the body, but keeps out of bouding box of the 
 * `forbidden_element`
 * @param {HTML_element} element 
 * @param {HTML_element} forbidden_element 
 */
const getRandomPostion = (element, forbidden_element, max_tries = 10) => 
{
  const width = element.getBoundingClientRect().width
  const height = element.getBoundingClientRect().height
  const b = width > height ? width : height

  const x_min = b 
  const y_min = b 
  const x_max = background_ele.getBoundingClientRect().width - b 
  const y_max = background_ele.getBoundingClientRect().height - b 

  const bouding_box = forbidden_element.getBoundingClientRect()

  let random_x = 0
  let random_y = 0

  let tries = 0
  do
  {
    random_x = getRandomNumber(x_min, x_max)
    random_y = getRandomNumber(y_min, y_max)

    if (tries == max_tries)
    {
      console.error('Screen too small')
      return [random_x,random_y]
    }
    tries++
  } 
  while (random_x >= bouding_box.x - b &&
         random_x <= bouding_box.x + bouding_box.width + b &&
         random_y >= bouding_box.y - b &&
         random_y <= bouding_box.y + bouding_box.height + b)

	return [random_x, random_y]
}

/**
 * Adds gradients to `svg` and returns the urls
 */
const generateGradients = () =>
{
  const two_phase_gradients = [
    {c1: '#B0FEFD', c2: '#25C8FF'},
    {c1: '#874DEA', c2: '#1681FB'},
    {c1: '#FAF7B1', c2: '#FF125F'},
    {c1: '#EFDA69', c2: '#17969B'},
  ].map(({c1, c2}) => 
  {
    gradient = svg.gradient('linear', (add) => 
    {
      add.stop(0, c1)
      add.stop(1, c2)
    }).from(0, 1).to(1, 0)
  
    return gradient.url()
  });
  
  const three_phase_gradients = [
    {c1: '#E92066', c2: '#E92066', c3: '#780631'},
    {c1: '#5F2AEA', c2: '#F047E6', c3: '#FC887B'},
  ].map(({c1, c2, c3}) => 
  {
    gradient = svg.gradient('linear', (add) => 
    {
      add.stop(0, c1)
      add.stop(0.5, c2)
      add.stop(1, c3)
    }).from(0, 1).to(1, 0)
  
    return gradient.url()
  });
  
  return [...two_phase_gradients, ...three_phase_gradients]
}

/**
 * Adds shapes to `svg`
 */
const generateShapes = () =>
{
  const gradients = generateGradients()
  const container = document.getElementsByClassName('container')[0]
  const paths = [
    'M0 64 L32 64 L16 0 Z',
    'M2 4 L26 52 L40 26 L38 4 Z',
    'M2 4 L26 52 L54 32 L44 4 Z',
    'm 0 50 q 50 25 100 0 l -3 -3 q -50 25 -94 0 l -3 3 Z',
    'M27.5307 9.48973C16.5 25.5446 5.50051 10.9899 4.00025 9.48973C2.50054 7.48973 1.97887e-05 9 1.00018 11.0318C3.49995 15.0638 16.5 29.5 30.3355 11.0318C36.9813 2.16079 47.5 2.5 52.0002 9C57.1728 16.4711 70.1961 33.7393 87.2317 10.0038C98.0003 -5 110.471 8.97567 112.474 11.0318C114.478 13.088 116.081 10.5178 114.077 7.94757C112.074 5.37737 96.0465 -9.01594 83.2248 9.48973C70.4032 27.9954 60.3084 15.7107 55.5002 8C52.0002 1.5 37.1809 -4.55587 27.5307 9.48973Z'
  ]
  const radi =  [10, 15, 20]
  const density = (
    background_ele.getBoundingClientRect().width * 
    background_ele.getBoundingClientRect().height) * 
    0.000001 * 
    density_multiplier

  for (let i = 0; i < 5000 * density; i++)
  {
    const radius = radi[getRandomNumber(0, radi.length)]
    const x = svg.circle(radius).fill('#FFFFFF')
    x.transform({
      position: getRandomPostion(x.node, container),
      rotate: getRandomNumber(0, 360),
    })
  }

  for (let i = 0; i < 1000 * density; i++)
  {
    const gradient = gradients[getRandomNumber(0, gradients.length)]
    const path = paths[getRandomNumber(0, paths.length)]
    const x = svg.path(path).fill(gradient)
    x.transform({
      position: getRandomPostion(x.node, container),
      rotate: getRandomNumber(0, 360),
      scale: 2
    })
  }
}

generateShapes()

window.addEventListener('resize', () => 
{
  background_ele.firstElementChild
    .innerHTML = ''
  generateShapes()
});
