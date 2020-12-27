import { SVG } from '@svgdotjs/svg.js'

const background_ele = document.getElementById('background')
const svg = SVG().addTo(background_ele).size('100%', '100%')

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
 * Generate a randomized grid
 * @param {number} density grid density ad percentage
 * @param {number} max_width max width of the grid
 * @param {number} max_height max height of the grid in pixels
 * @param {number} rand_offset max amount of random offset for each point on the grid
 * @param {HTMLElement} forbidden_element element to keep out of
 * @param {number} padding extra padding in pixels for the keepout area of `forbidden_element`
 * @returns a list of position in the form of [x, y]
 */
const generateGrid = (density, max_width, max_height, rand_offset, forbidden_element, padding = 50) => 
{
  let grid = []

  const bouding_box = forbidden_element.getBoundingClientRect()

  const number_of_points_x = Math.floor(max_width * density)
  const number_of_points_y = Math.floor(max_height * density)

  const offset_x = Math.floor((max_width / number_of_points_x) / 2)
  const offset_y = Math.floor((max_height / number_of_points_y) / 2)

  let pos_x, pos_y, rand_offset_x, rand_offset_y
  for (let i = 0; i < number_of_points_x; i++)
  {
    for (let j = 0; j < number_of_points_y; j++)
    {
      rand_offset_x = getRandomNumber(-rand_offset, rand_offset)
      rand_offset_y = getRandomNumber(-rand_offset, rand_offset)

      pos_x = i * (max_width / number_of_points_x) + offset_x + rand_offset_x
      pos_y = j * (max_height / number_of_points_y) + offset_y + rand_offset_y

      if (pos_x > bouding_box.x - padding && 
          pos_x < bouding_box.x + bouding_box.width + padding &&
          pos_y > bouding_box.y - padding && 
          pos_y < bouding_box.y + bouding_box.height + padding)
      {
        continue;
      }

      grid.push([pos_x, pos_y])
    }
  }

  return grid
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
    {c1: '#FEF63B', c2: '#FDC223'},
    {c1: '#1ECFD5', c2: '#95FB8D'},
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
    {c1: '#FAC550', c2: '#FF927E', c3: '#1B1BB9'},
    // {c1: '#FAC550', c2: '#FF927E', c3: '#1B1BB9'},
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
  const max_width = background_ele.getBoundingClientRect().width
  const max_height = background_ele.getBoundingClientRect().height

  const keep_out_ele = document.getElementsByClassName('container')[0]

  const gradients = generateGradients()
  const paths = [
    'M0 64 L32 64 L16 0 Z',
    'M2 4 L26 52 L40 26 L38 4 Z',
    'M2 4 L26 52 L54 32 L44 4 Z',
    'm 0 50 q 50 25 100 0 l -3 -3 q -50 25 -94 0 l -3 3 Z',
    // 'M27.5307 9.48973C16.5 25.5446 5.50051 10.9899 4.00025 9.48973C2.50054 7.48973 1.97887e-05 9 1.00018 11.0318C3.49995 15.0638 16.5 29.5 30.3355 11.0318C36.9813 2.16079 47.5 2.5 52.0002 9C57.1728 16.4711 70.1961 33.7393 87.2317 10.0038C98.0003 -5 110.471 8.97567 112.474 11.0318C114.478 13.088 116.081 10.5178 114.077 7.94757C112.074 5.37737 96.0465 -9.01594 83.2248 9.48973C70.4032 27.9954 60.3084 15.7107 55.5002 8C52.0002 1.5 37.1809 -4.55587 27.5307 9.48973Z',
    // 'M42.8198 29.0456C46.0721 28.1544 46.4617 30.1596 45.6148 30.7165C39.5167 34.7268 33.334 32.5732 31.132 30.9022C30.3697 30.3453 27.5695 28.0966 24.5258 16.2349C21.4767 4.35244 14.2777 11.3457 11.8215 16.2349C11.6765 16.5235 7.24767 24.5896 1.91184 21.0621C-0.629355 19.3821 -0.375101 12.3359 1.14969 8.994C3.08801 4.74575 4.36834 3.48601 7.24798 1.0105C9.53475 -1.0318 12.1815 0.407052 10.551 1.93881C6.28237 5.94911 4.62209 9.11777 4.19861 10.108C3.18199 12.8929 3.38226 17.0051 3.69044 17.9058C4.4527 20.1338 6.03632 19.6414 7.24799 18.0915C8.26398 16.7918 7.56607 15.5808 12.5838 10.4793C18.4274 4.53809 25.5421 8.80833 26.8125 13.2642C27.3323 15.0872 29.2686 22.3617 30.6237 25.3323C35.7055 32.5732 38.7545 30.1596 42.8198 29.0456Z',
    'M32.2588 34.8095C31.3495 37.6441 28.1669 42.2837 25.3993 44.8455C22.6316 47.4074 20.5757 45.524 22.8752 42.8311C26.8565 38.1687 27.9795 36.5667 28.4019 35.6796C29.46 33.4572 27.3256 32.4471 26.1953 32.5791L21.7656 32.8863C17.7598 33.144 18.3068 27.6232 21.9307 26.9902L25.7877 26.1203C29.0597 25.2346 26.9105 25.3596 25.8719 25.271L18.5593 25.0752C15.0195 24.8588 15.3561 21.4614 18.6403 20.0286C20.3002 19.485 24.8742 17.5798 29.7226 16.0064C34.571 14.433 30.6966 14.6335 29.425 14.7819L10.6903 17.8084C7.72339 18.1552 8.25089 14.9454 10.1791 14.5099C24.8097 10.6193 32.5378 10.8505 34.573 11.4525C39.8732 12.9331 36.5695 16.6768 33.7512 17.6354L25.0631 20.748C24.265 21.051 23.0841 21.6926 24.746 21.8344C26.4078 21.9762 28.0809 22.0048 28.7097 22.0014C33.5942 23.446 29.4343 27.3736 27.9297 27.7592C26.4111 28.2863 24.052 29.2613 26.7648 28.9446C30.1558 28.5487 33.3014 31.5595 32.2588 34.8095Z',
    'M32 20.7407L18.5143 40L0 28.7831L8.22857 0L32 20.7407Z',
    'M0 44.1L11.6854 49L65 4.655L53.8015 0L0 44.1Z',
    'M18.2595 18.4839C28.9084 13.6586 31.313 21.2411 31.313 23.309L32 30.5469C32 35.3721 27.1908 34.3381 26.5038 32.2702L25.1297 23.6537C25.1297 22.5508 24.2137 22.7346 23.7557 22.9644L18.603 25.0323C15.3052 26.6867 13.5648 24.8026 13.1067 23.6537L12.0762 15.3819L5.54945 17.1052C2.80134 17.7945 1.7708 16.5307 1.42728 15.3819L0.0532291 3.31884C-0.633764 -1.16179 5.54989 -0.817219 5.89296 2.62952L6.9235 10.5567L13.7938 8.48873C16.8858 7.4546 17.8416 9.3349 17.9159 10.9013C18.0304 13.314 18.2595 18.2081 18.2595 18.4839Z',
    // 'M27.6132 4.65186C31.8947 9.73476 25.0316 10.9181 23.5562 9.44375C21.2212 7.47797 15.7477 2.87574 9.54706 9.0752C4.3861 14.2352 7.08974 20.624 11.391 21.9755C16.9949 23.7447 20.1164 19.0268 20.9766 16.4467C23.5574 10.5493 28.2576 14.7998 27.2442 18.2896C24.5897 27.4306 17.5353 29.2245 14.3399 28.9788C1.96919 28.0279 -2.19748 18.6401 1.06805 9.44359C5.12531 -1.98268 21.7143 -2.35114 27.6132 4.65186Z'
  ]
  const radi =  [10, 15, 20]

  dots_grid = generateGrid(0.01, max_width, max_height, 50, keep_out_ele)
  dots_grid.forEach(pos => {
    const radius = radi[getRandomNumber(0, radi.length)]
    svg.circle(radius)
      .fill('#FFFFFF')
      .transform({
        position: pos,
      })
  })

  shapes_grid = generateGrid(0.005, max_width, max_height, 100, keep_out_ele)
  shapes_grid.forEach(pos => {
    const gradient = gradients[getRandomNumber(0, gradients.length)]
    const path = paths[getRandomNumber(0, paths.length)]
    svg.path(path)
      .fill(gradient)
      .transform({
        position: pos,
        rotate: getRandomNumber(0, 360),
        scale: 2
      })
  })
}

generateShapes()

window.addEventListener('resize', () => 
{
  background_ele.firstElementChild
    .innerHTML = ''
  generateShapes()
});
