import React from 'react'
import styled from 'styled-components'

const ToolContainer = styled.div`
  display: flex;
  padding: 20px 30px 10px;
  justify-content: space-between;
  flex-wrap: wrap;
`

const Tool = styled.div`
  width: 200px;
  height: 50px;
  margin-bottom: 10px;
  cursor: pointer;
  padding: 10px;
  &:hover {
    background: #ebeef3;
  }
`

const ToolTitle = styled.div``

const ToolDesc = styled.div`
  font-size: 12px;
  color: #aaa;
`

export default class Main extends React.Component {
  render() {
    return (
      <ToolContainer>
        <Tool>
          <ToolTitle>BASE64</ToolTitle>
          <ToolDesc>Base64 Decode and Encode</ToolDesc>
        </Tool>
      </ToolContainer>
    )
  }
}
