import React from 'react'
import styled from 'styled-components'
import { connect } from 'react-redux'
import { IRootState } from '../reducers'
import { ITool } from '../reducers/app'
import map from 'licia/map'

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

interface IProps {
  tools: ITool[]
}

class Main extends React.Component<IProps> {
  render() {
    const tools = map(this.props.tools, (tool) => {
      return (
        <Tool>
          <ToolTitle>{tool.title}</ToolTitle>
          <ToolDesc>{tool.description}</ToolDesc>
        </Tool>
      )
    })

    return <ToolContainer>{tools}</ToolContainer>
  }
}

const mapStateToProps = (state: IRootState): IProps => ({
  tools: state.app.tools,
})

export default connect(mapStateToProps)(Main)
