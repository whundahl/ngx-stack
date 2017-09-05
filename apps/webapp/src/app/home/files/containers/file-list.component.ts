import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ViewChild,
  TemplateRef
} from '@angular/core'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { Router, ActivatedRoute } from '@angular/router'
import { Container, ContainerApi } from '@ngx-plus/ngx-sdk'
import { Observable } from 'rxjs/Observable'
import { Subscription } from 'rxjs/Subscription'
import 'rxjs/add/operator/map'

import { NgxUiService, ModalComponent, GridConfig } from '../../../ui'
import { FileActions } from '../../../state'
import { FilesService } from '../files.service'

@Component({
  selector: 'ngx-file-list',
  template: `
    <ngx-grid [config]="gridConfig"
              (action)="handleAction($event)">
    </ngx-grid>
    <ng-template #filesTmpl let-row="row" let-value="value">
      <button class="btn btn-outline-info p-1"
              (click)="handleAction({ type: 'ViewFiles', payload: row })">
        <i class="fa fa-fw fa-search"></i>
        <span class="badge badge-info text-white m-0">{{ value | number }}</span>
      </button>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileListComponent implements OnInit {

  @ViewChild('filesTmpl') filesTmpl: TemplateRef<any>
  public gridConfig: GridConfig
  public modalRef
  private subscriptions: Subscription[]

  constructor(
    public service: FilesService,
    public ui: NgxUiService,
    private router: Router,
    private route: ActivatedRoute,
  ) { }

  ngOnInit() {
    this.service.read()
    this.subscriptions = []
    this.gridConfig = {
      card: {
        cardTitle: 'Files',
        icon: 'fa fa-fw fa-files-o',
        showSearch: true,
      },
      table: {
        actionButtons: [
          {
            action: 'Upload',
            class: 'btn btn-outline-info btn-sm',
            icon: 'fa fa-fw fa-cloud-upload',
          },
          {
            action: 'Delete',
            class: 'btn btn-outline-danger btn-sm',
            icon: 'fa fa-fw fa-trash',
          },
        ],
        columns: [
          { field: 'name', label: 'Container', action: 'ViewFiles' },
          { field: 'size', label: 'Files', cellTemplate: this.filesTmpl },
        ],
        count$: this.service.items$.map(items => items.count),
        items$: this.service.items$.map(items =>
          items.ids.map(id => items.entities[id])
        ),
      },
      toolbar: {
        actionButton: {
          action: 'InitCreate',
          class: 'btn btn-outline-primary btn-block',
          label: 'Create New Container',
          icon: 'fa fa-fw fa-plus',
        },
      },
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe())
  }

  showModal(item, form, title) {
    this.ui.modalRef = this.ui.modal.open(ModalComponent, { size: 'lg' })
    this.ui.modalRef.componentInstance.item = item
    this.ui.modalRef.componentInstance.formConfig = form
    this.ui.modalRef.componentInstance.title = title
    this.subscriptions.push(
      this.ui.modalRef.componentInstance.action.subscribe(event =>
        this.handleAction(event)
      )
    )
  }

  handleAction(event) {
    switch (event.type) {
      case 'InitCreate':
        const form = this.service.formConfig
        return this.showModal(new Container(), form, 'Create New Container')
      case 'Close':
      case 'Cancel':
        return this.ui.modalRef.close()
      case 'Save':
        this.service.create(event.payload)
        return this.ui.modalRef.close()
      case 'Upload':
        return this.router.navigate([event.payload.name, 'upload'], {
          relativeTo: this.route.parent,
        })
      case 'ViewFiles':
        return this.router.navigate([event.payload.name, 'list'], {
          relativeTo: this.route.parent,
        })
      case 'Delete':
        const successCb = () => this.service.delete(event.payload)
        const question = {
          title: 'Are you sure?',
          text: 'This action cannot be undone.',
        }
        return this.ui.alerts.alertError(question, successCb, () => ({}))
      default:
        return console.log('$event', event)
    }
  }
}
